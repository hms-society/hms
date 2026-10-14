import { expect, type Page } from '@playwright/test'

import { test } from '../../fixtures/auth-fixture'

const BACKEND_URL = 'http://hms-api.test'
const LAWYER_ID = '8acdc623-d2ad-42e3-9855-6af994216606'
const APPOINTMENT_ID = 'appointment-1'

type AgendaMockOptions = {
  calendarState?: 'success' | 'empty' | 'error' | 'forbidden' | 'loading'
  detail?: Record<string, unknown>
  rescheduleStatus?: number
}

// This route test intentionally mocks HTTP at the browser boundary. It covers the
// real TanStack route, page, query hooks, widgets, URL state, and dialog behavior;
// it is not evidence of a live REST/Auth integration.
const appointment = (id: string, clientName: string, startsAt: string) => ({
  kind: 'appointment' as const,
  appointmentId: id,
  scheduleId: 'schedule-1',
  clientId: 'client-1',
  clientName,
  lawyerId: LAWYER_ID,
  lawyerName: 'Dra. Ana Silva',
  startsAt,
  endsAt: new Date(new Date(startsAt).getTime() + 45 * 60_000).toISOString(),
  timeZone: 'America/Sao_Paulo',
  status: 'scheduled' as const,
  consultationStatus: 'pending' as const,
  updatedAt: '2026-09-20T12:00:00.000Z',
})

async function mockAgendaHttp(page: Page, options: AgendaMockOptions = {}) {
  const calendarRequests: string[] = []
  const activeLawyerRequests: string[] = []
  const events = [
    appointment('appointment-1', 'Mariana Costa', '2026-09-24T12:00:00.000Z'),
    appointment('appointment-2', 'João Silva', '2026-09-24T13:00:00.000Z'),
    // 02:00Z is 23:00 on 24 September in the appointment IANA timezone.
    appointment('appointment-3', 'Cliente no limite local', '2026-09-25T02:00:00.000Z'),
  ]

  await page.route(`${BACKEND_URL}/collaborators/me`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        collaboratorId: 'attendant-1',
        profile: 'attendant',
        professionalName: 'Atendente HMS',
        status: 'active',
      }),
    })
  })
  await page.route(`${BACKEND_URL}/communications/summary`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ unreadCount: 0 }),
    })
  })
  await page.route(`${BACKEND_URL}/scheduling/calendar/filters*`, async (route) => {
    const kind = new URL(route.request().url()).searchParams.get('kind')
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items:
          kind === 'client'
            ? [{ id: 'client-1', name: 'Mariana Costa' }]
            : [{ id: LAWYER_ID, name: 'Dra. Ana Silva' }],
      }),
    })
  })
  await page.route(`${BACKEND_URL}/scheduling/calendar?*`, async (route) => {
    calendarRequests.push(route.request().url())
    if (options.calendarState === 'loading') {
      await new Promise((resolve) => setTimeout(resolve, 1500))
    }
    if (options.calendarState === 'error' || options.calendarState === 'forbidden') {
      await route.fulfill({
        status: options.calendarState === 'forbidden' ? 403 : 503,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Agenda indisponível para esta captura.' }),
      })
      return
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(options.calendarState === 'empty' ? [] : events),
    })
  })
  await page.route(
    `${BACKEND_URL}/collaborators/active-collaborators*`,
    async (route) => {
      activeLawyerRequests.push(route.request().url())
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          items: [
            {
              collaboratorId: LAWYER_ID,
              professionalName: 'Dra. Ana Silva',
              email: 'ana@example.com',
              profile: 'lawyer',
              status: 'active',
              legalExpertises: [
                {
                  legalArea: { id: 'area-1', name: 'Direito Civil', active: true },
                  legalTopics: [{ id: 'topic-1', name: 'Contratos' }],
                },
              ],
            },
          ],
          page: 1,
          pageSize: 100,
          total: 1,
          totalPages: 1,
        }),
      })
    },
  )
  await page.route(`${BACKEND_URL}/collaborators/lawyers*`, async (route) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            collaboratorId: LAWYER_ID,
            professionalName: 'Dra. Ana Silva',
            email: 'ana@example.com',
            profile: 'lawyer',
            status: 'active',
            legalExpertises: [
              {
                legalArea: { id: 'area-1', name: 'Direito Civil', active: true },
                legalTopics: [{ id: 'topic-1', name: 'Contratos' }],
              },
            ],
          },
        ],
        page: 1,
        pageSize: 10,
        total: 1,
        totalPages: 1,
      }),
    })
  })
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/${APPOINTMENT_ID}`,
    async (route) => {
      if (options.detail) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(options.detail),
        })
        return
      }
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...events[0],
          consultationId: 'consultation-1',
          consultationStatus: 'pending',
          changes: [],
        }),
      })
    },
  )
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/appointment-3`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...events[2],
          consultationId: 'consultation-3',
          consultationStatus: 'pending',
          changes: [],
        }),
      })
    },
  )
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/${APPOINTMENT_ID}/slots*`,
    async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          {
            startsAt: '2026-10-01T13:00:00.000Z',
            endsAt: '2026-10-01T13:45:00.000Z',
            timeZone: 'America/Sao_Paulo',
          },
        ]),
      })
    },
  )
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/${APPOINTMENT_ID}/reschedule`,
    async (route) => {
      await route.fulfill({
        status: options.rescheduleStatus ?? 200,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Revision conflict.' }),
      })
    },
  )

  return { activeLawyerRequests, calendarRequests }
}

const visualStates = [
  { name: 'loading', state: 'loading' as const },
  { name: 'empty', state: 'empty' as const },
  {
    name: 'filtered-empty',
    state: 'empty' as const,
    query: '&clientId=11111111-1111-4111-8111-111111111111',
  },
  { name: 'error', state: 'error' as const },
  { name: 'restricted', state: 'forbidden' as const },
]

for (const viewport of [
  { name: 'desktop', width: 1417, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
]) {
  for (const visualState of visualStates) {
    test(`captures ${visualState.name} agenda at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      const consoleErrors: string[] = []
      const pageErrors: string[] = []
      const calendarResponses: number[] = []
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text())
      })
      page.on('pageerror', (error) => pageErrors.push(error.message))
      page.on('response', (response) => {
        if (response.url().includes('/scheduling/calendar?')) {
          calendarResponses.push(response.status())
        }
      })

      await mockAgendaHttp(page, { calendarState: visualState.state })
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const filteredStateQuery = visualState.query ?? ''
      await page.goto(
        `/agenda/consultas?view=week&date=2026-09-24&event=all${filteredStateQuery}`,
      )
      await expect(
        page.getByRole('heading', { name: 'Agenda de Consultas' }),
      ).toBeVisible()

      if (visualState.name === 'loading') {
        await expect(page.getByRole('status')).toContainText('Carregando agenda')
      } else if (visualState.name === 'empty') {
        await expect(page.getByRole('heading', { name: 'Agenda vazia' })).toBeVisible()
      } else if (visualState.name === 'filtered-empty') {
        await expect(
          page.getByRole('heading', { name: 'Nenhuma consulta encontrada' }),
        ).toBeVisible()
        await expect(page.getByRole('button', { name: 'Limpar filtros' })).toBeVisible()
      } else if (visualState.name === 'error') {
        await expect(page.getByRole('alert')).toContainText(
          'Não foi possível carregar a agenda',
          { timeout: 15_000 },
        )
        await expect(page.getByRole('button', { name: 'Tentar novamente' })).toBeVisible()
      } else {
        await expect(page.getByRole('heading', { name: 'Agenda restrita' })).toBeVisible({
          timeout: 15_000,
        })
      }

      const dimensions = await page.evaluate(() => ({
        width: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyText: document.querySelector('main')?.innerText ?? '',
      }))
      expect(dimensions).toMatchObject({
        width: viewport.width,
        scrollWidth: viewport.width,
      })
      await page.screenshot({
        path: `/tmp/hms-appointments-${visualState.name}-${viewport.width}x${viewport.height}.png`,
      })
      console.log(
        JSON.stringify({
          visualState: visualState.name,
          viewport: `${viewport.width}x${viewport.height}`,
          mainText: dimensions.bodyText,
          calendarResponses,
          consoleErrors,
          pageErrors,
        }),
      )
      if (visualState.name === 'error' || visualState.name === 'restricted') {
        expect(consoleErrors).toHaveLength(4)
        const expectedConsoleStatus =
          visualState.name === 'error' ? '503 (Service Unavailable)' : '403 (Forbidden)'
        expect(
          consoleErrors.every((message) => message.includes(expectedConsoleStatus)),
        ).toBe(true)
      } else {
        expect(consoleErrors).toEqual([])
      }
      expect(pageErrors).toEqual([])
      if (visualState.name !== 'loading') {
        const expectedStatus =
          visualState.name === 'error'
            ? 503
            : visualState.name === 'restricted'
              ? 403
              : 200
        expect(calendarResponses.every((status) => status === expectedStatus)).toBe(true)
        expect(calendarResponses).toHaveLength(
          visualState.name === 'error' || visualState.name === 'restricted' ? 4 : 1,
        )
      }
    })
  }
}

test('captures mobile reschedule conflict recovery and keyboard focus', async ({
  page,
}) => {
  const consoleErrors: string[] = []
  const pageErrors: string[] = []
  const detailRequests: number[] = []
  const slotRequests: string[] = []
  const rescheduleRequests: string[] = []
  const rescheduleResponses: number[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text())
  })
  page.on('pageerror', (error) => pageErrors.push(error.message))
  page.on('response', (response) => {
    if (response.url().endsWith(`/scheduling/appointments/${APPOINTMENT_ID}`)) {
      detailRequests.push(response.status())
    }
    if (
      response.url().endsWith(`/scheduling/appointments/${APPOINTMENT_ID}/reschedule`)
    ) {
      rescheduleResponses.push(response.status())
    }
  })
  await mockAgendaHttp(page, { rescheduleStatus: 409 })
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/${APPOINTMENT_ID}/slots*`,
    async (route) => {
      slotRequests.push(route.request().url())
      await route.fallback()
    },
  )
  await page.route(
    `${BACKEND_URL}/scheduling/appointments/${APPOINTMENT_ID}/reschedule`,
    async (route) => {
      rescheduleRequests.push(route.request().postDataJSON().startsAt)
      await route.fallback()
    },
  )
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/agenda/consultas?view=week&date=2026-09-24&event=all')

  const appointmentTrigger = page.getByRole('button', { name: /Mariana Costa, 09:00/ })
  await appointmentTrigger.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Consulta agendada')
  await page.keyboard.press('Escape')
  await expect(appointmentTrigger).toBeFocused()
  await appointmentTrigger.press('Enter')
  await expect(page.getByRole('button', { name: 'Remarcar' })).toBeVisible()
  await page.getByRole('button', { name: 'Remarcar' }).click()

  const rescheduleDialog = page.getByRole('dialog').last()
  await expect(rescheduleDialog).toContainText('Remarcar consulta')
  await page.getByLabel('Nova data').fill('2026-10-01')
  const slotButton = page.getByRole('button', { name: /10:00/ })
  await expect(slotButton).toBeVisible()
  await slotButton.click()
  await page.getByRole('button', { name: 'Confirmar remarcação' }).click()
  await expect(rescheduleDialog.getByRole('alert')).toContainText(
    'O agendamento foi alterado por outra pessoa',
  )
  await expect(
    rescheduleDialog.getByRole('button', { name: 'Atualizar dados e horários' }),
  ).toBeVisible()
  await rescheduleDialog
    .getByRole('button', { name: 'Atualizar dados e horários' })
    .scrollIntoViewIfNeeded()
  await page.screenshot({
    path: '/tmp/hms-appointments-conflict-recovery-390x844.png',
  })

  const beforeReload = { detail: detailRequests.length, slots: slotRequests.length }
  await rescheduleDialog
    .getByRole('button', { name: 'Atualizar dados e horários' })
    .click()
  await expect.poll(() => detailRequests.length).toBeGreaterThan(beforeReload.detail)
  await expect.poll(() => slotRequests.length).toBeGreaterThan(beforeReload.slots)
  await expect(slotButton).toHaveAttribute('aria-pressed', 'true')
  await expect(rescheduleDialog.getByRole('alert')).toHaveCount(0)

  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions).toEqual({ width: 390, scrollWidth: 390 })
  console.log(
    JSON.stringify({
      scenario: 'reschedule-conflict-reload',
      viewport: '390x844',
      detailResponses: detailRequests,
      slotsRequested: slotRequests.map((url) =>
        new URL(url).searchParams.get('lawyerId'),
      ),
      attemptedStartsAt: rescheduleRequests,
      rescheduleResponses,
      consoleErrors,
      pageErrors,
      dimensions,
      selectedSlotRetained: await slotButton.getAttribute('aria-pressed'),
    }),
  )
  expect(rescheduleRequests).toEqual(['2026-10-01T13:00:00.000Z'])
  expect(rescheduleResponses).toEqual([409])
  expect(consoleErrors).toEqual([
    'Failed to load resource: the server responded with a status of 409 (Conflict)',
  ])
  expect(pageErrors).toEqual([])
})

test('preserves URL state, local-date overflow, keyboard focus, and mobile layout', async ({
  page,
}) => {
  page.on('pageerror', (error) => console.log(`PAGE_ERROR: ${error.message}`))
  page.on('console', (message) => {
    if (message.type() === 'error') console.log(`CONSOLE_ERROR: ${message.text()}`)
  })
  const { activeLawyerRequests, calendarRequests } = await mockAgendaHttp(page)
  const expectedUrl = '/agenda/consultas?view=week&date=2026-09-24&event=all'

  await page.goto(expectedUrl)
  await expect(page).toHaveURL(new RegExp(`${expectedUrl.replaceAll('?', '\\?')}$`))
  await expect(page.getByRole('heading', { name: 'Agenda de Consultas' })).toBeVisible({
    timeout: 15_000,
  })
  const desktopFilterWidths = await page
    .locator('[aria-label^="Filtrar por"]')
    .evaluateAll((controls) =>
      controls.map((control) => control.getBoundingClientRect().width),
    )
  expect(desktopFilterWidths).toEqual([160, 160, 160])
  await expect(page.getByRole('button', { name: 'Hoje' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Mariana Costa, 09:00/ })).toBeVisible()

  await expect.poll(() => activeLawyerRequests.length).toBeGreaterThan(0)
  const activeLawyerRequest = new URL(activeLawyerRequests[0])
  expect(activeLawyerRequest.searchParams.get('page')).toBe('1')
  expect(activeLawyerRequest.searchParams.get('limit')).toBe('100')
  expect(activeLawyerRequest.searchParams.get('profile')).toBe('lawyer')

  const firstRequest = new URL(calendarRequests[0])
  expect(firstRequest.searchParams.get('view')).toBe('week')
  expect(firstRequest.searchParams.get('date')).toBe('2026-09-24')
  expect(firstRequest.searchParams.get('event')).toBe('all')

  await page.getByRole('button', { name: 'Filtrar por advogado' }).click()
  await expect(page.getByRole('dialog')).toContainText('Selecionar advogado')
  const lawyerOption = page.getByRole('option', { name: /Dra\. Ana Silva/ })
  await expect(lawyerOption).toBeVisible()
  await lawyerOption.click()
  await expect(lawyerOption).toHaveAttribute('aria-selected', 'true')
  await page.getByRole('button', { name: 'Selecionar advogado' }).click()
  await expect(page).toHaveURL(new RegExp(`lawyerId=${LAWYER_ID}`))
  await expect(page.getByRole('button', { name: 'Filtrar por advogado' })).toContainText(
    'Dra. Ana Silva',
  )

  const appointmentTrigger = page.getByRole('button', {
    name: /Mariana Costa, 09:00/,
  })
  await appointmentTrigger.press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Consulta agendada')
  await page.keyboard.press('Escape')
  await expect(appointmentTrigger).toBeFocused()

  await page.getByRole('tab', { name: 'Mês' }).press('Enter')
  await expect(page).toHaveURL(/view=month&date=2026-09-24&event=all/)

  const overflowTrigger = page.getByRole('button', { name: '+1 consultas' })
  await overflowTrigger.click()
  await expect(page.getByRole('dialog')).toContainText('Cliente no limite local')
  await page.getByRole('button', { name: /Cliente no limite local/ }).press('Enter')
  await expect(page.getByRole('dialog')).toContainText('Consulta agendada')
  await page.keyboard.press('Escape')
  await expect(overflowTrigger).toBeFocused()

  await overflowTrigger.click()
  await expect(page.getByRole('dialog')).toContainText('Cliente no limite local')
  await page.keyboard.press('Escape')
  await expect(overflowTrigger).toBeFocused()

  await page.setViewportSize({ width: 587, height: 844 })
  const referenceFilterWidths = await page
    .locator('[aria-label^="Filtrar por"]')
    .evaluateAll((controls) =>
      controls.map((control) => control.getBoundingClientRect().width),
    )
  expect(referenceFilterWidths).toEqual([160, 160, 160])
  await page.setViewportSize({ width: 390, height: 844 })
  await expect(page.getByRole('region', { name: 'Agenda em lista' })).toBeVisible()
  const mobileFilterWidths = await page
    .locator('[aria-label^="Filtrar por"]')
    .evaluateAll((controls) =>
      controls.map((control) => control.getBoundingClientRect().width),
    )
  expect(mobileFilterWidths).toEqual([160, 160, 160])
  const dimensions = await page.evaluate(() => ({
    width: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))
  expect(dimensions.width).toBe(390)
  expect(dimensions.scrollWidth).toBe(390)
})

test('keeps the selected client label inside its fixed-width filter', async ({
  page,
}) => {
  await mockAgendaHttp(page)
  await page.setViewportSize({ width: 587, height: 844 })
  await page.goto(
    '/agenda/consultas?view=week&date=2026-09-24&event=all&clientId=11111111-1111-4111-8111-111111111111',
  )

  const clientFilter = page.getByRole('button', { name: 'Filtrar por cliente' })
  await expect(clientFilter).toContainText('Cliente selecionado')
  const hasOverflow = await clientFilter.evaluate(
    (control) => control.scrollWidth > control.clientWidth,
  )
  expect(hasOverflow).toBe(false)
})
