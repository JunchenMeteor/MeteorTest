import OpenAI from 'openai'
import { NextRequest, NextResponse } from 'next/server'
import { demoExecutors, demoProjects, demoTasks, isLocalDemo } from '@/lib/localDemo'
import { createAdminClient } from '@/lib/supabase/admin'
import { requireRole } from '@/lib/auth/roles'
import { isUuid, taskRef } from '@/lib/viewModels/displayRefs'
import { dictionaries, normalizeLocale, type Dictionary } from '@/content/i18n'

type ChatMessage = { role: 'user' | 'assistant'; content: string }
type ToolResult = { ok: boolean; action?: string; data?: unknown; error?: string }
type AiConfig = { aiModel?: string; aiBaseUrl?: string }
type Suggestion = {
  label: string
  prompt: string
  autoSubmit?: boolean
  kind?: 'task_picker'
  projects?: Array<{ name: string; key: string; suites: Array<{ name: string; suiteKey: string }> }>
  environments?: string[]
}
type AiApiCopy = Dictionary['aiApi']
type SuiteSnapshot = { name: string; suite_key: string; type?: string }
type ProjectSnapshot = { name: string; key: string; test_suites?: SuiteSnapshot[] | null }
type NamedRecord = { name?: string; key?: string; suite_key?: string }
type NamedRelation = NamedRecord | NamedRecord[] | null
type TaskSnapshot = {
  display_id?: string
  status?: string
  environment?: string
  projects?: NamedRelation
  test_suites?: NamedRelation
  parameters?: unknown
}
type PlatformSnapshot = { projects: ProjectSnapshot[]; recentTasks?: TaskSnapshot[]; executors?: unknown[] }

function serviceClient() {
  return createAdminClient()
}

function normalize(value?: string | null) {
  return value?.trim().toLowerCase()
}

function sameText(a?: string | null, b?: string | null) {
  return Boolean(normalize(a) && normalize(a) === normalize(b))
}

async function getPlatformSnapshot(): Promise<PlatformSnapshot> {
  if (isLocalDemo()) {
    return {
      projects: demoProjects.map(({ key, name, repo_url, description, test_suites }) => ({ key, name, repo_url, description, test_suites })),
      recentTasks: demoTasks.map(task => ({
        display_id: 'display_id' in task && typeof task.display_id === 'string' ? task.display_id : undefined,
        status: task.status,
        environment: task.environment,
        projects: task.projects,
        test_suites: task.test_suites,
        parameters: task.parameters,
      })),
      executors: demoExecutors.map(({ name, type, status, capabilities, last_heartbeat_at }) => ({ name, type, status, capabilities, last_heartbeat_at })),
    }
  }

  const supabase = serviceClient()
  const [{ data: projects }, { data: tasks }, { data: executors }] = await Promise.all([
    supabase
      .from('projects')
      .select('key, name, repo_url, description, test_suites(suite_key, name, type, command), app_builds(display_id, platform, version, build_number)')
      .order('created_at', { ascending: false })
      .limit(30),
    supabase
      .from('tasks')
      .select('display_id, status, environment, created_at, projects(name, key), test_suites(name, suite_key), reports(summary, log_url), ai_analyses(failure_reason, suggestion, flaky_probability)')
      .order('created_at', { ascending: false })
      .limit(20),
    supabase
      .from('executors')
      .select('name, type, status, capabilities, last_heartbeat_at')
      .order('status'),
  ])

  return { projects: projects ?? [], recentTasks: tasks ?? [], executors: executors ?? [] }
}

function getTaskActionRef(action: ToolResult) {
  if (!action.ok || !['create_task', 'get_task_detail'].includes(action.action ?? '') || !action.data || typeof action.data !== 'object') return null
  return taskRef(action.data as { id?: unknown; display_id?: unknown; parameters?: unknown })
}

function extractTaskRef(text: string) {
  return text.match(/\bMT-\d{8}-\d{4}\b/i)?.[0]
}

function uniqueSuggestions(suggestions: Suggestion[]) {
  const seen = new Set<string>()
  return suggestions.filter(suggestion => {
    if (seen.has(suggestion.prompt)) return false
    seen.add(suggestion.prompt)
    return true
  }).slice(0, 6)
}

function includesAny(text: string, keywords: string[]) {
  return keywords.some(keyword => text.includes(keyword))
}

function relationLabel(value: NamedRelation) {
  const item = Array.isArray(value) ? value[0] : value
  return item?.name ?? item?.key ?? item?.suite_key ?? ''
}

function taskLabel(task: TaskSnapshot, copy: AiApiCopy) {
  const project = relationLabel(task.projects ?? null)
  const suite = relationLabel(task.test_suites ?? null)
  return [project, suite].filter(Boolean).join(' / ') || taskRef(task) || copy.taskFallback
}

function hasPublicTaskRef(task?: TaskSnapshot) {
  return Boolean(task && taskRef(task))
}

function buildTaskListSuggestions(snapshot: { recentTasks?: TaskSnapshot[] }, copy: AiApiCopy) {
  const tasks = snapshot.recentTasks ?? []
  const first = tasks[0]
  const failed = tasks.find(task => ['failed', 'timeout'].includes(task.status ?? ''))
  const running = tasks.find(task => ['queued', 'running'].includes(task.status ?? ''))

  const suggestions: Suggestion[] = []
  if (hasPublicTaskRef(first)) {
    const ref = taskRef(first!)
    suggestions.push({
      label: copy.viewTaskDetail(taskLabel(first, copy)),
      prompt: copy.queryTaskStatus(ref),
    })
  }
  if (hasPublicTaskRef(failed)) {
    const ref = taskRef(failed!)
    suggestions.push({
      label: copy.analyzeFailedTask,
      prompt: copy.analyzeTask(ref),
    })
    const project = relationLabel(failed!.projects ?? null)
    const suite = relationLabel(failed!.test_suites ?? null)
    if (project && suite) {
      suggestions.push({
        label: copy.rerunFailedSuite,
        prompt: copy.rerunSuitePrompt(project, suite, failed!.environment ?? 'dev'),
      })
    }
  }
  if (hasPublicTaskRef(running) && taskRef(running!) !== (first ? taskRef(first) : '')) {
    const ref = taskRef(running!)
    suggestions.push({
      label: copy.trackRunningTask,
      prompt: copy.queryTaskStatus(ref),
    })
  }
  suggestions.push(
    { label: copy.executorStatus, prompt: copy.executorStatusPrompt },
    { label: copy.todayReport, prompt: copy.todayReportPrompt },
  )

  return uniqueSuggestions(suggestions)
}

function buildSuiteTaskSuggestions(text: string, snapshot: { projects: ProjectSnapshot[] }, copy: AiApiCopy) {
  const matchedProjects = snapshot.projects.filter(project => {
    const name = normalize(project.name)
    const key = normalize(project.key)
    return Boolean((name && text.includes(name)) || (key && text.includes(key)))
  })
  const projects = matchedProjects.length ? matchedProjects : snapshot.projects.slice(0, 2)
  const environments = matchedProjects.length ? ['dev', 'staging'] : ['dev']

  const suggestions = projects.flatMap(project => {
    const matchedSuites = (project.test_suites ?? []).filter(suite => {
      const name = normalize(suite.name)
      const key = normalize(suite.suite_key)
      return Boolean((name && text.includes(name)) || (key && text.includes(key)))
    })
    const suites = matchedSuites.length ? matchedSuites : (project.test_suites ?? []).slice(0, matchedProjects.length ? 2 : 1)
    return suites.flatMap(suite => environments.map(env => ({
        label: copy.createSuiteTaskLabel(project.name, suite.name, env),
        prompt: copy.createSuiteTaskPrompt(project.name, suite.suite_key, env),
        autoSubmit: true,
      })))
  })
  return suggestions.slice(0, 4)
}

function buildTaskPickerSuggestion(snapshot: { projects: ProjectSnapshot[] }, copy: AiApiCopy): Suggestion | null {
  const projects = snapshot.projects
    .map(project => ({
      name: project.name,
      key: project.key,
      suites: (project.test_suites ?? [])
        .map(suite => ({ name: suite.name, suiteKey: suite.suite_key }))
        .filter(suite => suite.name && suite.suiteKey),
    }))
    .filter(project => project.name && project.key && project.suites.length)

  if (!projects.length) return null
  return {
    kind: 'task_picker',
    label: copy.taskPickerLabel,
    prompt: copy.createTaskPrompt,
    projects,
    environments: ['dev', 'staging', 'prod'],
  }
}

function buildSuggestions(message: string, reply: string, snapshot: { projects: ProjectSnapshot[]; recentTasks?: TaskSnapshot[] }, actions: ToolResult[], copy: AiApiCopy, history: ChatMessage[] = []): Suggestion[] {
  const historyText = normalize(history.slice(-4).map(item => item.content).join(' ')) ?? ''
  const text = normalize(`${historyText} ${message} ${reply}`) ?? ''
  const currentText = normalize(`${message} ${reply}`) ?? ''
  const activeTaskId = actions.map(getTaskActionRef).find(Boolean) ?? extractTaskRef(text)
  const hasCreatedTask = actions.some(action => action.ok && action.action === 'create_task')
  const hasTaskDetail = actions.some(action => action.ok && action.action === 'get_task_detail')
  const latestTaskId = activeTaskId ?? (snapshot.recentTasks?.[0] ? taskRef(snapshot.recentTasks[0]) : null)

  if (hasCreatedTask && activeTaskId) {
    return [
      { label: copy.queryThisTask, prompt: copy.queryTaskStatus(activeTaskId) },
      { label: copy.recentTasks, prompt: copy.recentTasksPrompt },
      { label: copy.todayReport, prompt: copy.todayReportPrompt },
    ]
  }

  if (hasTaskDetail && activeTaskId) {
    return [
      { label: copy.analyzeThisTask, prompt: copy.analyzeTask(activeTaskId) },
      { label: copy.relatedSuites, prompt: copy.relatedSuitesPrompt(activeTaskId) },
      { label: copy.recentTasks, prompt: copy.recentTasksPrompt },
    ]
  }

  if (actions.some(action => action.ok && action.action === 'create_project')) {
    return [
      { label: copy.projectSuites, prompt: copy.projectSuitesPrompt },
      { label: copy.importSuites, prompt: copy.importSuitesPrompt },
      { label: copy.createTask, prompt: copy.createTaskPrompt },
    ]
  }

  const asksForTaskList = includesAny(currentText, ['最近', 'latest', 'recent', '列表', 'list', '列出', '查看'])
    && includesAny(currentText, ['任务', 'task'])
  if (asksForTaskList) {
    return buildTaskListSuggestions(snapshot, copy)
  }

  if (/套件|suite|测试集|用例集/.test(text)) {
    return uniqueSuggestions([
      buildTaskPickerSuggestion(snapshot, copy),
      ...buildSuiteTaskSuggestions(text, snapshot, copy),
      { label: copy.executorStatus, prompt: copy.executorCapabilitiesPrompt },
    ].filter(Boolean) as Suggestion[])
  }

  if (/(任务|状态|运行|结果|queued|running|succeeded|failed|timeout)/.test(currentText) && latestTaskId) {
    return [
      { label: copy.viewTaskDetail(latestTaskId), prompt: copy.queryTaskStatus(latestTaskId) },
      { label: copy.analyzeThisTask, prompt: copy.analyzeTask(latestTaskId) },
      { label: copy.executorStatus, prompt: copy.executorStatusPrompt },
    ]
  }

  if (/失败|failed|报告|report|分析/.test(currentText)) {
    return [
      { label: copy.failedTasks, prompt: copy.failedTasksPrompt },
      { label: copy.executorStatus, prompt: copy.executorStatusPrompt },
      { label: copy.todayOverview, prompt: copy.todayOverviewPrompt },
    ]
  }

  const wantsTask = /任务|执行|运行|触发|创建|新建|套件|suite/.test(text)
  if (!wantsTask) return []

  return uniqueSuggestions([
    buildTaskPickerSuggestion(snapshot, copy),
    ...buildSuiteTaskSuggestions(text, snapshot, copy),
  ].filter(Boolean) as Suggestion[])
}

function finalReplyForActions(actions: ToolResult[], copy: AiApiCopy) {
  if (actions.some(action => action.ok && action.action === 'create_task')) {
    return copy.taskCreatedReply
  }
  if (actions.some(action => action.ok && action.action === 'create_project')) {
    return copy.projectCreatedReply
  }
  if (actions.some(action => action.ok && action.action === 'get_task_detail')) {
    return copy.taskStatusReply
  }
  return null
}

async function getTaskDetail(args: Record<string, unknown>, copy: AiApiCopy): Promise<ToolResult> {
  const taskId = String(args.task_ref ?? args.task_id ?? args.id ?? '').trim()
  if (!taskId) return { ok: false, error: copy.missingTaskRef }

  const supabase = serviceClient()
  const query = supabase
    .from('tasks')
    .select('display_id, environment, status, created_at, started_at, finished_at, projects(name, key), test_suites(name, suite_key), reports(summary, log_url, allure_url, created_at), ai_analyses(failure_reason, impact, suggestion, flaky_probability)')
  const { data, error } = isUuid(taskId)
    ? await query.eq('id', taskId).single()
    : await query.eq('display_id', taskId).single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, action: 'get_task_detail', data }
}

async function createProject(args: Record<string, unknown>, copy: AiApiCopy): Promise<ToolResult> {
  const access = await requireRole('admin')
  if (!access.ok) return { ok: false, error: copy.createProjectAdminRequired }

  const key = String(args.key ?? '').trim()
  const name = String(args.name ?? '').trim()
  const repoUrl = String(args.repo_url ?? '').trim()
  const description = String(args.description ?? '').trim()
  if (!key || !name) return { ok: false, error: copy.missingProjectNameKey }

  const supabase = serviceClient()
  const { data, error } = await supabase
    .from('projects')
    .insert({ key, name, repo_url: repoUrl, description: description || null })
    .select('key, name, repo_url, description')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, action: 'create_project', data }
}

async function createTask(args: Record<string, unknown>, copy: AiApiCopy): Promise<ToolResult> {
  const access = await requireRole('operator')
  if (!access.ok) return { ok: false, error: copy.createTaskOperatorRequired }

  const supabase = serviceClient()
  const projectId = String(args.project_id ?? '').trim()
  const projectName = String(args.project_name ?? '').trim()
  const suiteId = String(args.suite_id ?? '').trim()
  const suiteName = String(args.suite_name ?? '').trim()
  const environment = String(args.environment ?? 'dev').trim()
  const appBuildId = String(args.app_build_id ?? '').trim()
  const appBuildRef = String(args.app_build_ref ?? '').trim()
  const { data: displayId } = await supabase.rpc('next_display_id', { prefix: 'MT', table_name: 'tasks' })

  let resolvedProjectId = projectId
  if (!resolvedProjectId && projectName) {
    const { data: projects, error } = await supabase.from('projects').select('id, key, name')
    if (error) return { ok: false, error: error.message }
    const matches = (projects ?? []).filter(p => sameText(p.name, projectName) || sameText(p.key, projectName))
    if (matches.length !== 1) {
      return {
        ok: false,
        error: matches.length > 1 ? copy.multipleProjects : copy.projectNotFound(projectName),
      }
    }
    resolvedProjectId = matches[0].id
  }

  if (!resolvedProjectId) return { ok: false, error: copy.missingProjectRef }

  let resolvedSuiteId = suiteId
  if (!resolvedSuiteId && suiteName) {
    const { data: suites, error } = await supabase
      .from('test_suites')
      .select('id, suite_key, name, project_id')
      .eq('project_id', resolvedProjectId)
    if (error) return { ok: false, error: error.message }
    const matches = (suites ?? []).filter(s => sameText(s.name, suiteName) || sameText(s.suite_key, suiteName))
    if (matches.length !== 1) {
      return {
        ok: false,
        error: matches.length > 1 ? copy.multipleSuites : copy.suiteNotFound(suiteName),
      }
    }
    resolvedSuiteId = matches[0].id
  }

  if (!resolvedSuiteId) return { ok: false, error: copy.missingSuiteRef }

  let resolvedAppBuildId = appBuildId
  if (!resolvedAppBuildId && appBuildRef) {
    const { data: build, error } = await supabase
      .from('app_builds')
      .select('id')
      .eq('display_id', appBuildRef)
      .maybeSingle()
    if (error) return { ok: false, error: error.message }
    resolvedAppBuildId = build?.id ?? ''
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      display_id: displayId,
      project_id: resolvedProjectId,
      suite_id: resolvedSuiteId,
      environment: environment || 'dev',
      status: 'queued',
      app_build_id: resolvedAppBuildId || null,
      created_by: 'ai',
    })
    .select('display_id, environment, status, created_at, projects(name, key), test_suites(name, suite_key)')
    .single()

  if (error) return { ok: false, error: error.message }
  return { ok: true, action: 'create_task', data }
}

function buildTools(copy: AiApiCopy): OpenAI.Chat.Completions.ChatCompletionTool[] {
  return [
    {
      type: 'function',
      function: {
        name: 'get_platform_snapshot',
        description: copy.tools.snapshot,
        parameters: { type: 'object', properties: {} },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_project',
        description: copy.tools.createProject,
        parameters: {
          type: 'object',
          properties: {
            name: { type: 'string', description: copy.tools.projectName },
            key: { type: 'string', description: copy.tools.projectKey },
            repo_url: { type: 'string', description: copy.tools.repoUrl },
            description: { type: 'string', description: copy.tools.projectDescription },
          },
          required: ['name', 'key'],
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'create_task',
        description: copy.tools.createTask,
        parameters: {
          type: 'object',
          properties: {
            project_name: { type: 'string', description: copy.tools.projectNameOrKey },
            suite_name: { type: 'string', description: copy.tools.suiteNameOrKey },
            environment: { type: 'string', enum: ['dev', 'staging', 'prod'] },
            app_build_ref: { type: 'string', description: copy.tools.appBuildRef },
          },
        },
      },
    },
    {
      type: 'function',
      function: {
        name: 'get_task_detail',
        description: copy.tools.getTaskDetail,
        parameters: {
          type: 'object',
          properties: {
            task_ref: { type: 'string', description: copy.tools.taskRef },
          },
          required: ['task_ref'],
        },
      },
    },
  ]
}

async function runTool(name: string, args: Record<string, unknown>, copy: AiApiCopy): Promise<ToolResult> {
  if (name === 'get_platform_snapshot') return { ok: true, action: name, data: await getPlatformSnapshot() }
  if (name === 'create_project') return createProject(args, copy)
  if (name === 'create_task') return createTask(args, copy)
  if (name === 'get_task_detail') return getTaskDetail(args, copy)
  return { ok: false, error: copy.unknownTool(name) }
}

export async function POST(req: NextRequest) {
  const { message, history, aiConfig, locale } = await req.json()
  const copy = dictionaries[normalizeLocale(locale)].aiApi
  if (!message?.trim()) return NextResponse.json({ error: copy.emptyMessage }, { status: 400 })
  if (!process.env.DEEPSEEK_API_KEY) return NextResponse.json({ error: copy.missingApiKey }, { status: 500 })
  const config = (aiConfig ?? {}) as AiConfig
  const model = config.aiModel?.trim() || 'deepseek-v4-pro'
  const baseURL = config.aiBaseUrl?.trim()
    ? config.aiBaseUrl.trim().replace(/\/$/, '').replace(/\/v1$/, '') + '/v1'
    : 'https://api.deepseek.com/v1'

  const snapshot = await getPlatformSnapshot()
  const systemPrompt = copy.systemPrompt(JSON.stringify(snapshot, null, 2))
  const tools = buildTools(copy)

  const chatHistory = (Array.isArray(history) ? history : [])
    .filter((m: ChatMessage) => (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
    .slice(-12)
    .map((m: ChatMessage) => ({ role: m.role, content: m.content }))

  const openai = new OpenAI({ apiKey: process.env.DEEPSEEK_API_KEY, baseURL })
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...chatHistory,
    { role: 'user', content: message },
  ]
  const actions: ToolResult[] = []

  for (let step = 0; step < 4; step += 1) {
    const response = await openai.chat.completions.create({
      model,
      max_tokens: 1200,
      messages,
      tools,
      tool_choice: 'auto',
    })

    const choice = response.choices[0].message
    messages.push(choice)

    if (!choice.tool_calls?.length) {
      const reply = choice.content ?? ''
      return NextResponse.json({ reply, actions, suggestions: buildSuggestions(message, reply, snapshot, actions, copy, chatHistory) })
    }

    for (const call of choice.tool_calls) {
      if (call.type !== 'function') continue
      let args: Record<string, unknown> = {}
      try {
        args = JSON.parse(call.function.arguments || '{}')
      } catch {
        args = {}
      }
      const result = await runTool(call.function.name, args, copy)
      actions.push(result)
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result),
      })
    }

    const finalReply = finalReplyForActions(actions, copy)
    if (finalReply) {
      return NextResponse.json({ reply: finalReply, actions, suggestions: buildSuggestions(message, finalReply, snapshot, actions, copy, chatHistory) })
    }
  }

  const reply = copy.exhaustedReply
  return NextResponse.json({ reply, actions, suggestions: buildSuggestions(message, reply, snapshot, actions, copy, chatHistory) })
}
