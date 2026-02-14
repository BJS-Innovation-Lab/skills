/**
 * Task Tracker
 * Manages expert assignments, monitors completion, handles escalation
 */

/**
 * Create a new task assignment
 * @param {Object} supabase - Supabase client
 * @param {Object} task - Task details
 */
async function createTask(supabase, { paperId, assignedTo, taskType = 'analysis' }) {
  const dueAt = new Date();
  dueAt.setHours(dueAt.getHours() + 24); // 24 hour deadline
  
  const { data, error } = await supabase
    .from('research_tasks')
    .insert({
      paper_id: paperId,
      assigned_to: assignedTo,
      task_type: taskType,
      due_at: dueAt.toISOString(),
      status: 'pending'
    })
    .select()
    .single();
  
  if (error) {
    console.error('[TaskTracker] Error creating task:', error);
    throw error;
  }
  
  console.log(`[TaskTracker] Created task ${data.id} for ${assignedTo}`);
  return data;
}

/**
 * Acknowledge a task
 * @param {Object} supabase - Supabase client
 * @param {string} taskId - Task ID
 */
async function acknowledgeTask(supabase, taskId) {
  const { data, error } = await supabase
    .from('research_tasks')
    .update({
      status: 'acknowledged',
      acknowledged_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Complete a task with results
 * @param {Object} supabase - Supabase client
 * @param {string} taskId - Task ID
 * @param {Object} result - Task result
 */
async function completeTask(supabase, taskId, { summary, resultJson, memoryLogged = false }) {
  const { data, error } = await supabase
    .from('research_tasks')
    .update({
      status: 'complete',
      completed_at: new Date().toISOString(),
      result_summary: summary,
      result_json: resultJson,
      memory_logged: memoryLogged,
      memory_verified_at: memoryLogged ? new Date().toISOString() : null
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get overdue tasks
 * @param {Object} supabase - Supabase client
 */
async function getOverdueTasks(supabase) {
  const { data, error } = await supabase.rpc('get_overdue_tasks');
  
  if (error) {
    console.error('[TaskTracker] Error getting overdue tasks:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Get tasks pending memory verification
 * @param {Object} supabase - Supabase client
 */
async function getUnverifiedMemoryTasks(supabase) {
  const { data, error } = await supabase
    .from('research_tasks')
    .select(`
      id,
      assigned_to,
      completed_at,
      paper_id,
      research_papers(title)
    `)
    .eq('status', 'complete')
    .eq('memory_logged', false)
    .order('completed_at', { ascending: true });
  
  if (error) {
    console.error('[TaskTracker] Error getting unverified tasks:', error);
    return [];
  }
  
  return data || [];
}

/**
 * Mark task as escalated
 * @param {Object} supabase - Supabase client
 * @param {string} taskId - Task ID
 */
async function escalateTask(supabase, taskId) {
  const { data, error } = await supabase
    .from('research_tasks')
    .update({
      escalated: true,
      escalated_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Verify memory was logged for a task
 * @param {Object} supabase - Supabase client
 * @param {string} taskId - Task ID
 */
async function verifyMemoryLogged(supabase, taskId) {
  const { data, error } = await supabase
    .from('research_tasks')
    .update({
      memory_logged: true,
      memory_verified_at: new Date().toISOString()
    })
    .eq('id', taskId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
}

/**
 * Get task statistics
 * @param {Object} supabase - Supabase client
 */
async function getTaskStats(supabase) {
  const { data, error } = await supabase.rpc('get_research_stats');
  
  if (error) {
    console.error('[TaskTracker] Error getting stats:', error);
    return null;
  }
  
  return data;
}

/**
 * Get tasks for a specific agent
 * @param {Object} supabase - Supabase client
 * @param {string} agentName - Agent name
 */
async function getAgentTasks(supabase, agentName, { status = null, limit = 10 } = {}) {
  let query = supabase
    .from('research_tasks')
    .select(`
      id,
      task_type,
      status,
      assigned_at,
      due_at,
      paper_id,
      research_papers(title, abstract, source_id)
    `)
    .eq('assigned_to', agentName)
    .order('assigned_at', { ascending: false })
    .limit(limit);
  
  if (status) {
    query = query.eq('status', status);
  }
  
  const { data, error } = await query;
  
  if (error) {
    console.error('[TaskTracker] Error getting agent tasks:', error);
    return [];
  }
  
  return data || [];
}

module.exports = {
  createTask,
  acknowledgeTask,
  completeTask,
  getOverdueTasks,
  getUnverifiedMemoryTasks,
  escalateTask,
  verifyMemoryLogged,
  getTaskStats,
  getAgentTasks
};
