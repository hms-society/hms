import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { DynamicFormListItem } from '@hms/core/legal-catalog/domain/structures'

import { DynamicFormsTable } from '../index'

const form: DynamicFormListItem = {
  id: 'form-1',
  name: 'Contrato',
  description: 'Descrição',
  status: 'available',
  stage: 'consultation',
  legalArea: { id: 'area-1', name: 'Cível' },
  legalTopics: [
    { id: 'topic-2', name: 'Família', position: 2 },
    { id: 'topic-1', name: 'Contratos', position: 1 },
  ],
  fieldCount: 4,
}

describe('DynamicFormsTable', () => {
  it('renders classification metadata, topic summary and actions', () => {
    render(
      <DynamicFormsTable
        items={[form]}
        page={1}
        pageSize={5}
        pageCount={2}
        total={6}
        isPending={false}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onChangeAvailability={vi.fn()}
        onDelete={vi.fn()}
        onPageChange={vi.fn()}
      />,
    )

    expect(screen.getAllByText('Contrato').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Contratos +1').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Cível').length).toBeGreaterThan(0)
    expect(screen.getByRole('columnheader', { name: 'Área jurídica' })).toBeInstanceOf(
      HTMLElement,
    )
    expect(
      screen.getAllByRole('link', { name: 'Próxima' })[0].getAttribute('aria-disabled'),
    ).toBeNull()
    expect(screen.getByRole('link', { name: 'Página 1' })).toBeTruthy()
    expect(screen.getByRole('link', { name: 'Página 2' })).toBeTruthy()
  })

  it('delegates pagination to the public callback', () => {
    const onPageChange = vi.fn()
    render(
      <DynamicFormsTable
        items={[form]}
        page={1}
        pageSize={5}
        pageCount={2}
        total={6}
        isPending={false}
        onEdit={vi.fn()}
        onDuplicate={vi.fn()}
        onChangeAvailability={vi.fn()}
        onDelete={vi.fn()}
        onPageChange={onPageChange}
      />,
    )

    fireEvent.click(screen.getAllByRole('link', { name: 'Próxima' })[1])
    expect(onPageChange).toHaveBeenCalledWith(2)
  })
})
