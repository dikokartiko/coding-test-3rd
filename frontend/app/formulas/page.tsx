'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useQuery } from '@tanstack/react-query'
import { formulaApi } from '@/lib/api'
import { Loader2, Plus, Save, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'

type FormulaFormValues = {
  name: string
  expression: string
  description?: string
  variables?: string
  tags?: string
  visibility: string
}

const AVAILABLE_VARIABLES = ['pic', 'dpi', 'irr', 'total_distributions']

export default function FormulasPage() {
  const [editingId, setEditingId] = useState<number | null>(null)
  const {
    data: formulas,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['formulas'],
    queryFn: () => formulaApi.list(),
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { isSubmitting },
  } = useForm<FormulaFormValues>({
    defaultValues: {
      name: '',
      expression: '',
      description: '',
      variables: '',
      tags: '',
      visibility: 'private',
    },
  })

  const onSubmit = async (values: FormulaFormValues) => {
    const payload = {
      ...values,
      variables: (values.variables || '')
        .split(',')
        .map((variable) => variable.trim())
        .filter(Boolean)
        .map((variable) => ({ name: variable })),
      tags: (values.tags || '')
        .split(',')
        .map((tag) => tag.trim())
        .filter(Boolean),
    }
    if (editingId) {
      await formulaApi.update(editingId, payload)
    } else {
      await formulaApi.create(payload)
    }
    reset()
    setEditingId(null)
    refetch()
  }

  const handleEdit = (formula: any) => {
    setEditingId(formula.id)
    reset({
      name: formula.name,
      expression: formula.expression,
      description: formula.description,
      variables: (formula.variables || []).map((v: any) => v.name).join(', '),
      tags: (formula.tags || []).join(', '),
      visibility: formula.visibility || 'private',
    })
  }

  const handleDelete = async (formulaId: number) => {
    if (!confirm('Delete this formula?')) return
    await formulaApi.delete(formulaId)
    if (editingId === formulaId) {
      setEditingId(null)
      reset()
    }
    refetch()
  }

  const handleCancel = () => {
    reset()
    setEditingId(null)
  }

  return (
    <div className="space-y-8">
      <header className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-blue-600">
          Custom metrics
        </p>
        <h1 className="text-3xl font-bold text-gray-900">Formula builder</h1>
        <p className="text-gray-600">
          Define reusable KPIs using variables like PIC, DPI, and IRR. Formulas are evaluated on every fund.
        </p>
        <div className="mt-4 rounded-xl border border-dashed border-gray-300 p-4 text-sm text-gray-600">
          Available variables:{' '}
          {AVAILABLE_VARIABLES.map((variable) => (
            <code key={variable} className="mx-1 rounded bg-gray-100 px-2 py-0.5">
              {variable}
            </code>
          ))}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[400px_minmax(0,1fr)]">
        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              {editingId ? 'Edit formula' : 'Create formula'}
            </h2>
            {editingId && (
              <button
                onClick={handleCancel}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Cancel edit
              </button>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700">Name</label>
              <input
                {...register('name', { required: true })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="Net DPI excl. fees"
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Expression</label>
              <textarea
                {...register('expression', { required: true })}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={3}
                placeholder="(total_distributions - fees) / pic"
                required
              />
              <p className="text-xs text-gray-500">
                Use basic math operators (+, -, *, /) and functions like abs(), min(), max(), round().
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Description</label>
              <textarea
                {...register('description')}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                rows={2}
                placeholder="Explain what this KPI represents"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Variables</label>
              <input
                {...register('variables')}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="pic, total_distributions"
              />
              <p className="text-xs text-gray-500">
                Optional metadata. Separate values with commas for documentation.
              </p>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Tags</label>
              <input
                {...register('tags')}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
                placeholder="returns, compliance"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-700">Visibility</label>
              <select
                {...register('visibility')}
                className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100"
              >
                <option value="private">Private</option>
                <option value="org">Organization</option>
                <option value="global">Global</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
            >
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : editingId ? (
                <Save className="h-4 w-4" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              {editingId ? 'Update formula' : 'Create formula'}
            </button>
          </form>
        </section>

        <section className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Saved formulas</h2>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center text-gray-500">
              <Loader2 className="h-5 w-5 animate-spin" />
            </div>
          ) : error ? (
            <p className="text-sm text-red-600">
              {(error as Error).message || 'Failed to load formulas'}
            </p>
          ) : !formulas?.length ? (
            <p className="text-sm text-gray-500">No custom formulas yet.</p>
          ) : (
            <ul className="space-y-4">
              {formulas.map((formula: any) => (
                <li
                  key={formula.id}
                  className={cn(
                    'rounded-2xl border border-gray-100 p-4 transition hover:border-gray-200',
                    editingId === formula.id && 'border-blue-200 bg-blue-50/50'
                  )}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-gray-900">{formula.name}</p>
                      <p className="text-xs text-gray-500">
                        Visibility: {formula.visibility || 'private'}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(formula)}
                        className="rounded-full border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 transition hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(formula.id)}
                        className="rounded-full border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {formula.description && (
                    <p className="mt-2 text-sm text-gray-600">{formula.description}</p>
                  )}
                  <div className="mt-3 rounded-xl bg-gray-50 p-3 text-sm font-mono text-gray-800">
                    {formula.expression}
                  </div>
                  {formula.tags?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {formula.tags.map((tag: string) => (
                        <span
                          key={`${formula.id}-${tag}`}
                          className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
