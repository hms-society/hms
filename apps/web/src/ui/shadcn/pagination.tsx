import type * as React from 'react'

import { cn } from '@/ui/shadcn/utils/index.ts'
import { Button } from '@/ui/shadcn/button.tsx'
import { ChevronLeftIcon, ChevronRightIcon, MoreHorizontalIcon } from 'lucide-react'

function Pagination({ className, ...props }: React.ComponentProps<'nav'>) {
  return (
    <nav
      aria-label='pagination'
      data-slot='pagination'
      className={cn('mx-auto flex w-full justify-center', className)}
      {...props}
    />
  )
}

function PaginationContent({ className, ...props }: React.ComponentProps<'ul'>) {
  return (
    <ul
      data-slot='pagination-content'
      className={cn('flex items-center gap-0.5', className)}
      {...props}
    />
  )
}

function PaginationItem({ ...props }: React.ComponentProps<'li'>) {
  return <li data-slot='pagination-item' {...props} />
}

type PaginationPagesProps = {
  page: number
  totalPages: number
  onPage: (page: number) => void
}

function PaginationPages({ page, totalPages, onPage }: PaginationPagesProps) {
  if (totalPages <= 0) return null

  const pages =
    totalPages <= 5
      ? Array.from({ length: totalPages }, (_, index) => index + 1)
      : Array.from({ length: 5 }, (_, index) => {
          if (page <= 3) return index + 1
          if (page >= totalPages - 2) return totalPages - 4 + index
          return page - 2 + index
        })

  const showLeadingEllipsis = totalPages > 5 && page > 3
  const showTrailingEllipsis = totalPages > 5 && page < totalPages - 2

  return (
    <>
      {showLeadingEllipsis && (
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      )}
      {pages.map((pageNumber) => (
        <PaginationItem key={pageNumber}>
          <PaginationLink
            href='#'
            aria-label={`Página ${pageNumber}`}
            isActive={page === pageNumber}
            onClick={(event) => {
              event.preventDefault()
              onPage(pageNumber)
            }}
          >
            {pageNumber}
          </PaginationLink>
        </PaginationItem>
      ))}
      {showTrailingEllipsis && (
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
      )}
    </>
  )
}

type PaginationLinkProps = {
  disabled?: boolean
  isActive?: boolean
} & Pick<React.ComponentProps<typeof Button>, 'size'> &
  React.ComponentProps<'a'>

function PaginationLink({
  className,
  disabled = false,
  isActive,
  size = 'icon-sm',
  tabIndex,
  ...props
}: PaginationLinkProps) {
  return (
    <Button
      asChild
      variant={isActive ? 'outline' : 'ghost'}
      size={size}
      className={cn(
        isActive && 'border-primary bg-secondary text-primary',
        disabled && 'pointer-events-none opacity-50',
        className,
      )}
    >
      <a
        aria-disabled={disabled || undefined}
        aria-current={isActive ? 'page' : undefined}
        data-slot='pagination-link'
        data-active={isActive}
        tabIndex={disabled ? -1 : tabIndex}
        {...props}
      />
    </Button>
  )
}

function PaginationPrevious({
  className,
  text = '',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label='Go to previous page'
      size='icon-sm'
      className={cn('border border-border bg-card text-muted-foreground', className)}
      {...props}
    >
      <ChevronLeftIcon data-icon='inline-start' />
      <span className='hidden sm:block'>{text}</span>
    </PaginationLink>
  )
}

function PaginationNext({
  className,
  text = '',
  ...props
}: React.ComponentProps<typeof PaginationLink> & { text?: string }) {
  return (
    <PaginationLink
      aria-label='Go to next page'
      size='icon-sm'
      className={cn('border border-border bg-card text-muted-foreground', className)}
      {...props}
    >
      <span className='hidden sm:block'>{text}</span>
      <ChevronRightIcon data-icon='inline-end' />
    </PaginationLink>
  )
}

function PaginationEllipsis({ className, ...props }: React.ComponentProps<'span'>) {
  return (
    <span
      aria-hidden
      data-slot='pagination-ellipsis'
      className={cn(
        "flex size-8 items-center justify-center [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    >
      <MoreHorizontalIcon />
      <span className='sr-only'>More pages</span>
    </span>
  )
}

export {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPages,
  PaginationPrevious,
}
