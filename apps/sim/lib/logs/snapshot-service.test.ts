import { describe, test, expect, beforeEach } from 'vitest'
import { SnapshotService } from './snapshot-service'
import type { WorkflowState } from './types'

describe('SnapshotService', () => {
  let service: SnapshotService

  beforeEach(() => {
    service = new SnapshotService()
  })

  describe('computeStateHash', () => {
    test('should generate consistent hashes for identical states', () => {
      const state: WorkflowState = {
        blocks: {
          'block1': {
            id: 'block1',
            type: 'agent',
            position: { x: 100, y: 200 },
            metadata: { id: 'agent', name: 'Test Agent' },
            config: { params: { prompt: 'Hello' } },
            subBlocks: {},
            outputs: {},
            enabled: true,
            horizontalHandles: true,
            isWide: false,
            advancedMode: false,
            height: '0',
          },
        },
        edges: [
          { id: 'edge1', source: 'block1', target: 'block2' },
        ],
        loops: {},
        parallels: {},
      }

      const hash1 = service.computeStateHash(state)
      const hash2 = service.computeStateHash(state)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA-256 hex string
    })

    test('should ignore position changes', () => {
      const baseState: WorkflowState = {
        blocks: {
          'block1': {
            id: 'block1',
            type: 'agent',
            position: { x: 100, y: 200 },
            metadata: { id: 'agent', name: 'Test Agent' },
            config: { params: { prompt: 'Hello' } },
            subBlocks: {},
            outputs: {},
            enabled: true,
            horizontalHandles: true,
            isWide: false,
            advancedMode: false,
            height: '0',
          },
        },
        edges: [],
        loops: {},
        parallels: {},
      }

      const stateWithDifferentPosition: WorkflowState = {
        ...baseState,
        blocks: {
          'block1': {
            ...baseState.blocks['block1'],
            position: { x: 500, y: 600 }, // Different position
          },
        },
      }

      const hash1 = service.computeStateHash(baseState)
      const hash2 = service.computeStateHash(stateWithDifferentPosition)

      expect(hash1).toBe(hash2)
    })

    test('should detect meaningful changes', () => {
      const baseState: WorkflowState = {
        blocks: {
          'block1': {
            id: 'block1',
            type: 'agent',
            position: { x: 100, y: 200 },
            metadata: { id: 'agent', name: 'Test Agent' },
            config: { params: { prompt: 'Hello' } },
            subBlocks: {},
            outputs: {},
            enabled: true,
            horizontalHandles: true,
            isWide: false,
            advancedMode: false,
            height: '0',
          },
        },
        edges: [],
        loops: {},
        parallels: {},
      }

      const stateWithDifferentPrompt: WorkflowState = {
        ...baseState,
        blocks: {
          'block1': {
            ...baseState.blocks['block1'],
            config: { params: { prompt: 'Different prompt' } }, // Different prompt
          },
        },
      }

      const hash1 = service.computeStateHash(baseState)
      const hash2 = service.computeStateHash(stateWithDifferentPrompt)

      expect(hash1).not.toBe(hash2)
    })

    test('should handle edge order consistently', () => {
      const state1: WorkflowState = {
        blocks: {},
        edges: [
          { id: 'edge1', source: 'a', target: 'b' },
          { id: 'edge2', source: 'b', target: 'c' },
        ],
        loops: {},
        parallels: {},
      }

      const state2: WorkflowState = {
        blocks: {},
        edges: [
          { id: 'edge2', source: 'b', target: 'c' }, // Different order
          { id: 'edge1', source: 'a', target: 'b' },
        ],
        loops: {},
        parallels: {},
      }

      const hash1 = service.computeStateHash(state1)
      const hash2 = service.computeStateHash(state2)

      expect(hash1).toBe(hash2) // Should be same despite different order
    })

    test('should handle empty states', () => {
      const emptyState: WorkflowState = {
        blocks: {},
        edges: [],
        loops: {},
        parallels: {},
      }

      const hash = service.computeStateHash(emptyState)
      expect(hash).toHaveLength(64)
    })

    test('should handle complex nested structures', () => {
      const complexState: WorkflowState = {
        blocks: {
          'block1': {
            id: 'block1',
            type: 'agent',
            position: { x: 100, y: 200 },
            metadata: { id: 'agent', name: 'Complex Agent' },
            config: { 
              params: { 
                prompt: 'Hello',
                model: 'gpt-4',
                temperature: 0.7,
                tools: ['search', 'calculator']
              } 
            },
            subBlocks: {
              'prompt': {
                id: 'prompt',
                type: 'short-input',
                value: 'Test prompt',
              },
              'model': {
                id: 'model',
                type: 'short-input',
                value: 'gpt-4',
              },
            },
            outputs: {
              response: {
                type: 'string',
                description: 'Agent response',
              },
            },
            enabled: true,
            horizontalHandles: true,
            isWide: false,
            advancedMode: true,
            height: '200',
          },
        },
        edges: [
          { id: 'edge1', source: 'block1', target: 'block2', sourceHandle: 'output' },
        ],
        loops: {
          'loop1': {
            id: 'loop1',
            type: 'loop',
            config: {
              iterationVariable: 'item',
              maxIterations: 10,
            },
          },
        },
        parallels: {
          'parallel1': {
            id: 'parallel1',
            type: 'parallel',
            config: {
              maxConcurrency: 3,
            },
          },
        },
      }

      const hash = service.computeStateHash(complexState)
      expect(hash).toHaveLength(64)

      // Should be consistent
      const hash2 = service.computeStateHash(complexState)
      expect(hash).toBe(hash2)
    })
  })
})
