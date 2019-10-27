import request from 'request'
import { remote } from '../../../src'

describe('reloadSession test', () => {
    const scenarios = [{
        name: 'should be undefined if sessionId is missing in response',
        sessionIdMock: 'ignored if jsonwpMode is false',
        requestMock: [{}, {}],
        newSessionId: undefined,
        jsonwpMode: false
    }, {
        name: 'should be ok if sessionId is in response',
        sessionIdMock: 'foobar-234',
        requestMock: [{}, {}],
        newSessionId: 'foobar-234',
        jsonwpMode: true
    }, {
        name: 'should be ok if sessionId is in response.value',
        sessionIdMock: undefined,
        requestMock: [{}, { sessionId: 'foobar-345' }],
        newSessionId: 'foobar-345',
    }, {
        name: 'should be sessionId if sessionId and value.sessionId are present',
        sessionIdMock: 'foobar-456',
        requestMock: [{}, { sessionId: 'foobar-567' }],
        newSessionId: 'foobar-456',
        jsonwpMode: true
    }]

    scenarios.forEach(scenario => {
        it(scenario.name, async () => {
            const oldSessionId = request.getSessionId()
            const hook = jest.fn()
            const browser = await remote({
                baseUrl: 'http://foobar.com',
                capabilities: {
                    jsonwpMode: scenario.jsonwpMode,
                    browserName: 'foobar'
                },
                onReload: [hook]
            })

            request.setSessionId(scenario.sessionIdMock)
            request.setMockResponse(scenario.requestMock)
            await browser.reloadSession()

            expect(request.mock.calls[1][0].method).toBe('DELETE')
            expect(request.mock.calls[1][0].uri.pathname).toBe(`/wd/hub/session/${oldSessionId}`)
            expect(request.mock.calls[2][0].method).toBe('POST')
            expect(request.mock.calls[2][0].uri.pathname).toBe('/wd/hub/session')
            expect(hook).toBeCalledWith(oldSessionId, scenario.newSessionId)
        })
    })

    it('should be ok even if deleteSession throws an exception (JSONWP)', async () => {
        let scenario = {
            sessionIdMock: 'foobar-234',
            requestMock: [{}, {}],
            newSessionId: 'foobar-234',
            jsonwpMode: true
        }

        const hook = jest.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                jsonwpMode: scenario.jsonwpMode,
                browserName: 'foobar'
            },
            onReload: [hook]
        })

        browser.sessionId = null // INFO: destroy sessionId in browser object

        request.setSessionId(scenario.sessionIdMock)
        request.setMockResponse(scenario.requestMock)

        await browser.reloadSession()

        // INFO: DELETE to /wd/hub/session/${oldSessionId} in not expected to be found in request.mock.calls as it will not complete
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.pathname).toBe('/wd/hub/session')
        expect(hook).toBeCalledWith(null, scenario.newSessionId)
    })

    it('should be ok even if deleteSession throws an exception (non-JSONWP)', async () => {
        let scenario = {
            sessionIdMock: 'ignored if jsonwpMode is false',
            requestMock: [{}, {}],
            newSessionId: undefined,
            jsonwpMode: false
        }

        const hook = jest.fn()
        const browser = await remote({
            baseUrl: 'http://foobar.com',
            capabilities: {
                jsonwpMode: scenario.jsonwpMode,
                browserName: 'foobar'
            },
            onReload: [hook]
        })

        browser.sessionId = null // INFO: destroy sessionId in browser object

        request.setSessionId(scenario.sessionIdMock)
        request.setMockResponse(scenario.requestMock)

        await browser.reloadSession()

        // INFO: DELETE to /wd/hub/session/${oldSessionId} in not expected to be found in request.mock.calls as it will not complete
        expect(request.mock.calls[1][0].method).toBe('POST')
        expect(request.mock.calls[1][0].uri.pathname).toBe('/wd/hub/session')
        expect(hook).toBeCalledWith(null, scenario.newSessionId)
    })

    afterEach(() => {
        request.mockClear()
        request.resetSessionId()
        request.setMockResponse()
    })
})
