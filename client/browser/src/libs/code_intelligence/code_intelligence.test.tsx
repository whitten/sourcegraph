jest.mock('worker-loader?inline!../../../../shared/src/api/extension/main.worker.ts', () => ({}))

import renderer from 'react-test-renderer'

const RENDER = jest.fn()

jest.mock('react-dom', () => ({
    createPortal: jest.fn(el => renderer.create(el).toJSON()),
    render: RENDER,
}))

jest.mock('uuid', () => ({
    v4: () => 'uuid',
}))

// import { uniqueId } from 'lodash'
import { integrationTestContext } from '../../../../../shared/src/api/integration-test/testHelpers'
import { initCodeIntelligence } from './code_intelligence'

describe('initCodeIntelligence()', () => {
    beforeAll(() => {
        ;(global as any).MutationObserver = class {}
    })

    afterAll(() => {
        delete (global as any).MutationObserver
    })

    afterEach(() => {
        for (const el of document.querySelectorAll('.test')) {
            el.remove()
        }
    })

    // const createTestElement = () => {
    //     const el = document.createElement('div')
    //     el.className = `test test-${uniqueId()}`
    //     document.body.appendChild(el)
    //     return el
    // }

    test('renders the overlay container ', async () => {
        const { services } = await integrationTestContext()
        initCodeIntelligence(
            {
                name: 'test',
                check: () => true,
            },
            {
                platformContext: {},
                extensionsController: {
                    services,
                },
            } as any,
            false
        )
        const overlayMount = document.body.firstChild! as HTMLElement
        expect(overlayMount.className).toBe('overlay-mount-container')
        const [palette, m] = RENDER.mock.calls.pop() as any
        expect(palette).toMatchSnapshot()
        expect(m).toBe(overlayMount)
    })
})
