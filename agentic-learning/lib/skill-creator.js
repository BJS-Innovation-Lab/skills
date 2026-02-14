/**
 * Skill Creator - Promote patterns to skills
 * 
 * Creates new skills from:
 * - Proven procedures
 * - Repeated patterns
 * - Learned rules
 */

const fs = require('fs');
const path = require('path');

class SkillCreator {
  constructor(learningDir, workspaceDir) {
    this.learningDir = learningDir;
    this.workspaceDir = workspaceDir || path.dirname(learningDir);
    this.skillsDir = path.join(this.workspaceDir, 'skills');
    this.draftPrefix = 'draft-';
    this.historyFile = path.join(learningDir, 'skills-created.jsonl');
  }

  /**
   * Safe file operations
   */
  safeParseJSON(filePath, defaultValue) {
    try {
      if (!fs.existsSync(filePath)) return defaultValue;
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    } catch (e) {
      return defaultValue;
    }
  }

  safeWriteFile(filePath, content) {
    try {
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, content);
      return true;
    } catch (e) {
      console.error('[skill-creator] Write error:', e.message);
      return false;
    }
  }

  /**
   * Generate skill name from procedure/pattern
   */
  generateSkillName(source) {
    const name = source.name || source.pattern || 'unnamed';
    return name.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 30);
  }

  /**
   * Create skill from procedure
   */
  async fromProcedure(procedure, options = {}) {
    const skillName = options.name || this.generateSkillName(procedure);
    const isDraft = options.draft !== false;
    const prefix = isDraft ? this.draftPrefix : '';
    const skillDir = path.join(this.skillsDir, `${prefix}${skillName}`);

    // Create SKILL.md
    const skillMd = this.generateSkillMd({
      name: skillName,
      description: procedure.description || `Skill created from procedure: ${procedure.name}`,
      source: 'procedure',
      source_id: procedure.id,
      steps: procedure.steps,
      trigger: procedure.trigger,
      metrics: procedure.metrics,
      created_at: new Date().toISOString()
    });

    // Create _meta.json
    const meta = {
      name: skillName,
      version: '0.1.0',
      description: procedure.description || `Auto-generated from procedure ${procedure.id}`,
      author: 'agentic-learning',
      private: true,
      source: {
        type: 'procedure',
        id: procedure.id,
        promoted_at: new Date().toISOString()
      }
    };

    // Write files
    this.safeWriteFile(path.join(skillDir, 'SKILL.md'), skillMd);
    this.safeWriteFile(path.join(skillDir, '_meta.json'), JSON.stringify(meta, null, 2));

    // Log creation
    this.logCreation({
      skill_name: skillName,
      source_type: 'procedure',
      source_id: procedure.id,
      is_draft: isDraft,
      created_at: new Date().toISOString()
    });

    return {
      name: skillName,
      path: skillDir,
      is_draft: isDraft,
      files: ['SKILL.md', '_meta.json']
    };
  }

  /**
   * Create skill from pattern
   */
  async fromPattern(pattern, options = {}) {
    const skillName = options.name || this.generateSkillName(pattern);
    const isDraft = options.draft !== false;
    const prefix = isDraft ? this.draftPrefix : '';
    const skillDir = path.join(this.skillsDir, `${prefix}${skillName}`);

    // Create SKILL.md
    const skillMd = this.generateSkillMd({
      name: skillName,
      description: pattern.description || `Skill created from pattern: ${pattern.pattern}`,
      source: 'pattern',
      pattern: pattern.pattern,
      occurrences: pattern.occurrences,
      examples: pattern.examples || [],
      created_at: new Date().toISOString()
    });

    // Create _meta.json
    const meta = {
      name: skillName,
      version: '0.1.0',
      description: pattern.description || `Auto-generated from pattern`,
      author: 'agentic-learning',
      private: true,
      source: {
        type: 'pattern',
        pattern: pattern.pattern,
        occurrences: pattern.occurrences,
        promoted_at: new Date().toISOString()
      }
    };

    // Write files
    this.safeWriteFile(path.join(skillDir, 'SKILL.md'), skillMd);
    this.safeWriteFile(path.join(skillDir, '_meta.json'), JSON.stringify(meta, null, 2));

    // Log creation
    this.logCreation({
      skill_name: skillName,
      source_type: 'pattern',
      pattern: pattern.pattern,
      is_draft: isDraft,
      created_at: new Date().toISOString()
    });

    return {
      name: skillName,
      path: skillDir,
      is_draft: isDraft,
      files: ['SKILL.md', '_meta.json']
    };
  }

  /**
   * Create skill from rules
   */
  async fromRules(rules, options = {}) {
    const skillName = options.name || 'learned-rules';
    const isDraft = options.draft !== false;
    const prefix = isDraft ? this.draftPrefix : '';
    const skillDir = path.join(this.skillsDir, `${prefix}${skillName}`);

    // Create SKILL.md
    const skillMd = this.generateRulesSkillMd({
      name: skillName,
      description: options.description || 'Learned rules and guidelines',
      rules: rules,
      created_at: new Date().toISOString()
    });

    // Create _meta.json
    const meta = {
      name: skillName,
      version: '0.1.0',
      description: options.description || 'Auto-generated rules skill',
      author: 'agentic-learning',
      private: true,
      source: {
        type: 'rules',
        rule_count: rules.length,
        promoted_at: new Date().toISOString()
      }
    };

    // Write files
    this.safeWriteFile(path.join(skillDir, 'SKILL.md'), skillMd);
    this.safeWriteFile(path.join(skillDir, '_meta.json'), JSON.stringify(meta, null, 2));

    // Log creation
    this.logCreation({
      skill_name: skillName,
      source_type: 'rules',
      rule_count: rules.length,
      is_draft: isDraft,
      created_at: new Date().toISOString()
    });

    return {
      name: skillName,
      path: skillDir,
      is_draft: isDraft,
      files: ['SKILL.md', '_meta.json']
    };
  }

  /**
   * Generate SKILL.md content
   */
  generateSkillMd(data) {
    let md = `# ${data.name}\n\n`;
    md += `${data.description}\n\n`;
    md += `---\n\n`;
    md += `## Origin\n\n`;
    md += `- **Source:** ${data.source}\n`;
    if (data.source_id) md += `- **Source ID:** ${data.source_id}\n`;
    if (data.pattern) md += `- **Pattern:** ${data.pattern}\n`;
    if (data.occurrences) md += `- **Occurrences:** ${data.occurrences}\n`;
    md += `- **Created:** ${data.created_at}\n`;
    md += `- **Generated by:** agentic-learning\n\n`;

    if (data.trigger) {
      md += `## When to Use\n\n`;
      if (data.trigger.patterns?.length) {
        md += `**Trigger patterns:**\n`;
        for (const p of data.trigger.patterns) {
          md += `- ${p}\n`;
        }
        md += `\n`;
      }
      if (data.trigger.context?.length) {
        md += `**Context keywords:**\n`;
        for (const c of data.trigger.context) {
          md += `- ${c}\n`;
        }
        md += `\n`;
      }
    }

    if (data.steps?.length) {
      md += `## Steps\n\n`;
      for (let i = 0; i < data.steps.length; i++) {
        const step = data.steps[i];
        md += `${i + 1}. **${step.action || step}**`;
        if (step.params) md += ` (${JSON.stringify(step.params)})`;
        md += `\n`;
      }
      md += `\n`;
    }

    if (data.metrics) {
      md += `## Metrics\n\n`;
      md += `- **Executions:** ${data.metrics.executions || 0}\n`;
      md += `- **Successes:** ${data.metrics.successes || 0}\n`;
      if (data.metrics.success_rate != null) {
        md += `- **Success Rate:** ${(data.metrics.success_rate * 100).toFixed(1)}%\n`;
      }
      md += `\n`;
    }

    if (data.examples?.length) {
      md += `## Examples\n\n`;
      for (const ex of data.examples.slice(0, 3)) {
        md += `- ${ex}\n`;
      }
      md += `\n`;
    }

    md += `---\n\n`;
    md += `*Auto-generated skill. Edit as needed.*\n`;

    return md;
  }

  /**
   * Generate rules SKILL.md
   */
  generateRulesSkillMd(data) {
    let md = `# ${data.name}\n\n`;
    md += `${data.description}\n\n`;
    md += `---\n\n`;
    md += `## Rules\n\n`;

    for (const rule of data.rules) {
      md += `### ${rule.title || 'Rule'}\n\n`;
      md += `${rule.content || rule.description || rule}\n\n`;
      if (rule.source) md += `*Source: ${rule.source}*\n\n`;
    }

    md += `---\n\n`;
    md += `## Origin\n\n`;
    md += `- **Created:** ${data.created_at}\n`;
    md += `- **Generated by:** agentic-learning\n\n`;

    return md;
  }

  /**
   * Promote draft to installed skill
   */
  async promoteDraft(draftName) {
    const draftDir = path.join(this.skillsDir, `${this.draftPrefix}${draftName}`);
    const finalDir = path.join(this.skillsDir, draftName);

    if (!fs.existsSync(draftDir)) {
      throw new Error(`Draft skill not found: ${draftName}`);
    }

    if (fs.existsSync(finalDir)) {
      throw new Error(`Skill already exists: ${draftName}`);
    }

    fs.renameSync(draftDir, finalDir);

    // Update meta
    const metaPath = path.join(finalDir, '_meta.json');
    const meta = this.safeParseJSON(metaPath, {});
    meta.promoted_at = new Date().toISOString();
    meta.is_draft = false;
    this.safeWriteFile(metaPath, JSON.stringify(meta, null, 2));

    return { name: draftName, path: finalDir };
  }

  /**
   * List draft skills
   */
  async listDrafts() {
    try {
      const files = fs.readdirSync(this.skillsDir);
      return files
        .filter(f => f.startsWith(this.draftPrefix))
        .map(f => ({
          name: f.replace(this.draftPrefix, ''),
          path: path.join(this.skillsDir, f),
          is_draft: true
        }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Delete draft skill
   */
  async deleteDraft(draftName) {
    const draftDir = path.join(this.skillsDir, `${this.draftPrefix}${draftName}`);
    
    if (!fs.existsSync(draftDir)) {
      throw new Error(`Draft skill not found: ${draftName}`);
    }

    fs.rmSync(draftDir, { recursive: true });
    return true;
  }

  /**
   * Log skill creation
   */
  logCreation(record) {
    try {
      fs.appendFileSync(this.historyFile, JSON.stringify(record) + '\n');
    } catch (e) {
      console.error('[skill-creator] Log error:', e.message);
    }
  }
}

module.exports = { SkillCreator };
