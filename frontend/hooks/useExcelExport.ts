'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { exportApi } from '@/lib/api'

type ExportStatus = 'idle' | 'queued' | 'processing' | 'ready' | 'error'

export function useExcelExport() {
  const [status, setStatus] = useState<ExportStatus>('idle')
  const [message, setMessage] = useState<string>('')
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      if (pollRef.current) {
        clearTimeout(pollRef.current)
      }
    }
  }, [])

  const triggerExport = useCallback(async (fundIds: number[], filenamePrefix = 'fund-export') => {
    if (!fundIds.length) return

    setStatus('processing')
    setMessage('Preparing Excel export...')
    try {
      const job = await exportApi.request(fundIds)
      poll(job.export_id, fundIds, filenamePrefix)
    } catch (error: any) {
      setStatus('error')
      setMessage(error?.response?.data?.detail || 'Failed to queue export job')
    }
  }, [])

  const poll = useCallback(
    async (exportId: string, fundIds: number[], filenamePrefix: string) => {
      try {
        const statusResponse = await exportApi.status(exportId)
        if (statusResponse.status === 'ready' && statusResponse.download_url) {
          const blob = await exportApi.download(exportId)
          const timestamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')
          downloadBlob(blob, `${filenamePrefix}-${fundIds.join('-')}-${timestamp}.xlsx`)
          setStatus('ready')
          setMessage('Export ready. Download started.')
          return
        }

        if (statusResponse.status === 'failed') {
          setStatus('error')
          setMessage(statusResponse.error || 'Export failed')
          return
        }

        setStatus('processing')
        setMessage('Export is running...')
        pollRef.current = setTimeout(() => poll(exportId, fundIds, filenamePrefix), 2500)
      } catch (error: any) {
        setStatus('error')
        setMessage(error?.response?.data?.detail || 'Failed to fetch export status')
      }
    },
    []
  )

  return { triggerExport, status, message }
}

function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.URL.revokeObjectURL(url)
}
