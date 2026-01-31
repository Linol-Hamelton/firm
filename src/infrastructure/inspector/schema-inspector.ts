/**
 * LAYER 3: Visual Schema Inspector
 *
 * Inspect schema structure for debugging and documentation.
 * Provides human-readable representation of schema hierarchy.
 *
 * Target: Help developers understand complex schemas at a glance.
 */

import type { Schema } from '../../common/types/schema.js';

// ============================================================================
// TYPES
// ============================================================================

export interface SchemaNode {
  /** Schema type */
  type: string;
  /** Path in schema tree */
  path: string;
  /** Configuration (simplified) */
  config?: Record<string, unknown> | undefined;
  /** Child nodes */
  children?: SchemaNode[];
  /** Whether this node is optional/nullable */
  optional?: boolean;
  /** Whether this node is nullable */
  nullable?: boolean;
  /** Default value if any */
  defaultValue?: unknown;
}

export interface InspectorOptions {
  /** Maximum depth to traverse (default: 10) */
  maxDepth?: number;
  /** Whether to include configuration details */
  includeConfig?: boolean;
  /** Whether to expand all nodes by default */
  expandAll?: boolean;
  /** Custom formatter for output */
  formatter?: (node: SchemaNode) => string;
}

// ============================================================================
// SCHEMA INSPECTOR
// ============================================================================

/**
 * Inspect a schema and return its tree structure.
 *
 * @example
 * ```ts
 * const tree = inspectSchema(schema);
 * console.log(visualizeTree(tree));
 * ```
 */
export function inspectSchema(
  schema: Schema<unknown>,
  options: InspectorOptions = {}
): SchemaNode {
  const { maxDepth = 10, includeConfig = true } = options;
  return traverseSchema(schema, '', maxDepth, includeConfig);
}

/**
 * Traverse schema recursively.
 */
function traverseSchema(
  schema: Schema<unknown>,
  path: string,
  depth: number,
  includeConfig: boolean
): SchemaNode {
  if (depth <= 0) {
    return {
      type: schema._type,
      path,
      config: includeConfig ? { truncated: true } : undefined,
    };
  }

  const node: SchemaNode = {
    type: schema._type,
    path,
  };

  // Extract basic config from schema (simplified)
  if (includeConfig && 'config' in schema) {
    const config = (schema as any).config;
    if (config && typeof config === 'object') {
      node.config = { ...config };
      // Remove internal fields
      if (node.config) {
        const configObj = node.config as Record<string, unknown>;
        delete configObj['_type'];
        delete configObj['_output'];
        delete configObj['_input'];
      }
    }
  }

  // Handle specific schema types
  switch (schema._type) {
    case 'object': {
      const shape = (schema as any).config?.shape;
      if (shape && typeof shape === 'object') {
        node.children = Object.entries(shape).map(([key, childSchema]) =>
          traverseSchema(
            childSchema as Schema<unknown>,
            path ? `${path}.${key}` : key,
            depth - 1,
            includeConfig
          )
        );
      }
      break;
    }

    case 'array': {
      const elementSchema = (schema as any).config?.element;
      if (elementSchema) {
        node.children = [
          traverseSchema(
            elementSchema,
            `${path}[]`,
            depth - 1,
            includeConfig
          ),
        ];
      }
      break;
    }

    case 'tuple': {
      const items = (schema as any).config?.items;
      if (Array.isArray(items)) {
        node.children = items.map((itemSchema: Schema<unknown>, index: number) =>
          traverseSchema(
            itemSchema,
            `${path}[${index}]`,
            depth - 1,
            includeConfig
          )
        );
      }
      break;
    }

    case 'union':
    case 'intersection':
    case 'discriminated_union': {
      const members = (schema as any).config?.members;
      if (Array.isArray(members)) {
        node.children = members.map((member: Schema<unknown>, index: number) =>
          traverseSchema(
            member,
            `${path}[${index}]`,
            depth - 1,
            includeConfig
          )
        );
      }
      break;
    }

    case 'lazy': {
      node.children = [
        {
          type: 'lazy',
          path: `${path}<lazy>`,
          config: { lazy: true },
        },
      ];
      break;
    }
  }

  return node;
}

/**
 * Convert schema tree to human-readable string.
 */
export function visualizeTree(node: SchemaNode, indent = 0): string {
  const spaces = '  '.repeat(indent);
  let result = `${spaces}${node.type} ${node.path}`;

  if (node.config && Object.keys(node.config).length > 0) {
    const configStr = JSON.stringify(node.config, null, 0).slice(0, 50);
    result += ` ${configStr}`;
  }

  if (node.children) {
    result += '\n' + node.children.map(child => visualizeTree(child, indent + 1)).join('\n');
  }

  return result;
}

/**
 * Print schema structure to console.
 */
export function printSchema(schema: Schema<unknown>, options: InspectorOptions = {}) {
  const tree = inspectSchema(schema, options);
  console.log(visualizeTree(tree));
}

/**
 * Generate HTML representation of schema (for web UI).
 * Returns a simple HTML string.
 */
export function generateHtml(schema: Schema<unknown>, options: InspectorOptions = {}): string {
  const tree = inspectSchema(schema, options);
  return generateHtmlNode(tree);
}

function generateHtmlNode(node: SchemaNode): string {
  const childrenHtml = node.children
    ? `<ul>${node.children.map(child => `<li>${generateHtmlNode(child)}</li>`).join('')}</ul>`
    : '';

  return `
    <div class="schema-node">
      <strong>${node.type}</strong> <code>${node.path}</code>
      ${childrenHtml}
    </div>
  `.trim();
}

/**
 * Calculate schema statistics (depth, node count, etc.)
 */
export function getSchemaStats(schema: Schema<unknown>): {
  nodeCount: number;
  maxDepth: number;
  types: Record<string, number>;
} {
  const tree = inspectSchema(schema, { includeConfig: false });
  const stats = {
    nodeCount: 0,
    maxDepth: 0,
    types: {} as Record<string, number>,
  };

  function traverse(node: SchemaNode, depth: number) {
    stats.nodeCount++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);
    stats.types[node.type] = (stats.types[node.type] || 0) + 1;

    if (node.children) {
      node.children.forEach(child => traverse(child, depth + 1));
    }
  }

  traverse(tree, 0);
  return stats;
}

/**
 * Default export.
 */
export default {
  inspectSchema,
  visualizeTree,
  printSchema,
  generateHtml,
  getSchemaStats,
};