import { useState, type FormEvent } from 'react'
import { formatWib } from '@/lib/api'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import type { UserItem, UserRole } from '@/types'

interface UsersManagementProps {
  users: UserItem[]
  onCreateUser: (payload: {
    email: string
    password: string
    role: UserRole
  }) => Promise<void>
  onRemoveUser: (user: UserItem) => Promise<void>
}

export function UsersManagement({
  users,
  onCreateUser,
  onRemoveUser,
}: UsersManagementProps) {
  const [newEmail, setNewEmail] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState<UserRole>('viewer')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    await onCreateUser({
      email: newEmail,
      password: newPassword,
      role: newRole,
    })
    setNewEmail('')
    setNewPassword('')
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pengguna Dashboard</CardTitle>
        <CardDescription>
          Tambahkan atau cabut akses akun administrator dan operator.
        </CardDescription>
      </CardHeader>
      <CardContent className='space-y-6'>
        <form
          onSubmit={(e) => void handleSubmit(e)}
          className='grid grid-cols-1 gap-4 sm:grid-cols-2'
        >
          <div className='grid gap-2'>
            <Label htmlFor='user-email'>Email</Label>
            <Input
              id='user-email'
              type='email'
              required
              placeholder='operator@example.com'
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='user-pass'>Password (min 8 karakter)</Label>
            <Input
              id='user-pass'
              type='password'
              minLength={8}
              required
              placeholder='Minimal 8 karakter'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className='grid gap-2'>
            <Label htmlFor='user-role'>Peran</Label>
            <Select
              value={newRole}
              onValueChange={(v) => setNewRole(v as UserRole)}
            >
              <SelectTrigger id='user-role' className='w-full'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='viewer'>Viewer (Operator)</SelectItem>
                <SelectItem value='admin'>Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className='flex items-end'>
            <Button type='submit' className='w-full'>
              Tambah Pengguna
            </Button>
          </div>
        </form>

        <div className='overflow-hidden rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Dibuat</TableHead>
                <TableHead className='text-right'>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => (
                <TableRow key={u.id}>
                  <TableCell className='font-medium'>{u.email}</TableCell>
                  <TableCell>
                    <Badge variant='secondary'>{u.role}</Badge>
                  </TableCell>
                  <TableCell className='text-xs text-muted-foreground'>
                    {formatWib(u.created_at)}
                  </TableCell>
                  <TableCell className='text-right'>
                    <Button
                      variant='destructive'
                      size='sm'
                      onClick={() => void onRemoveUser(u)}
                    >
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  )
}
