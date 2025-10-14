'use client'

import Link from 'next/link'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Eye } from 'lucide-react'

interface StormglassLog {
  id: string
  spot_id: string | null
  endpoint: string
  status: string
  response_summary: any
  error_message: string | null
  latitude: number | null
  longitude: number | null
  created_at: string
  spots?: {
    id: string
    name: string
    slug: string
  } | null
}

interface StormglassLogsTableProps {
  logs: StormglassLog[]
}

function formatTimestamp(timestamp: string): string {
  const date = new Date(timestamp)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)

  let timeAgo = ''
  if (diffMins < 1) {
    timeAgo = 'À l\'instant'
  } else if (diffMins < 60) {
    timeAgo = `il y a ${diffMins}min`
  } else if (diffHours < 24) {
    timeAgo = `il y a ${diffHours}h`
  } else {
    timeAgo = date.toLocaleDateString('fr-FR')
  }

  return `${date.toLocaleString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  })} (${timeAgo})`
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'success':
      return <Badge variant="default" className="bg-green-600">Succès</Badge>
    case 'error':
      return <Badge variant="destructive">Erreur</Badge>
    case 'quota_exceeded':
      return <Badge variant="secondary" className="bg-orange-600 text-white">Quota dépassé</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function formatResponseSummary(summary: any): string {
  if (!summary) return '-'
  
  const parts: string[] = []
  
  if (summary.hoursCount) {
    parts.push(`${summary.hoursCount} heures`)
  }
  
  if (summary.dataStart && summary.dataEnd) {
    const start = new Date(summary.dataStart).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    const end = new Date(summary.dataEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })
    parts.push(`${start} → ${end}`)
  }
  
  return parts.length > 0 ? parts.join(' • ') : '-'
}

export function StormglassLogsTable({ logs }: StormglassLogsTableProps) {
  if (logs.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Aucun log disponible
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Spot</TableHead>
            <TableHead>Endpoint</TableHead>
            <TableHead>Statut</TableHead>
            <TableHead>Résumé</TableHead>
            <TableHead>Coordonnées</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {logs.map((log) => (
            <TableRow key={log.id}>
              <TableCell className="text-xs">
                {formatTimestamp(log.created_at)}
              </TableCell>
              <TableCell>
                {log.spots ? (
                  <Link 
                    href={`/spots/${log.spots.slug}`} 
                    target="_blank"
                    className="hover:underline font-medium"
                  >
                    {log.spots.name}
                  </Link>
                ) : (
                  <span className="text-muted-foreground">-</span>
                )}
              </TableCell>
              <TableCell>
                <Badge variant="outline">{log.endpoint}</Badge>
              </TableCell>
              <TableCell>
                {getStatusBadge(log.status)}
              </TableCell>
              <TableCell className="text-sm">
                {log.error_message ? (
                  <span className="text-red-600">{log.error_message}</span>
                ) : (
                  <span className="text-muted-foreground">
                    {formatResponseSummary(log.response_summary)}
                  </span>
                )}
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {log.latitude && log.longitude ? (
                  <span>
                    {log.latitude.toFixed(4)}, {log.longitude.toFixed(4)}
                  </span>
                ) : (
                  '-'
                )}
              </TableCell>
              <TableCell className="text-right">
                {log.spots && (
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/spots/${log.spots.slug}`} target="_blank" title="Voir le spot">
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
