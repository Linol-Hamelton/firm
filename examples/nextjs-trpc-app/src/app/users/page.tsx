'use client';

import { useState } from 'react';
import { trpc } from '@/lib/trpc';

/**
 * User management page with FIRM-validated tRPC
 */
export default function UsersPage() {
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    age: '',
    bio: '',
  });

  // tRPC queries and mutations
  const { data, isLoading, refetch } = trpc.user.list.useQuery({
    limit: 10,
    search: search || undefined,
  });

  const createMutation = trpc.user.create.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      alert('User created successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const updateMutation = trpc.user.update.useMutation({
    onSuccess: () => {
      refetch();
      resetForm();
      alert('User updated successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const deleteMutation = trpc.user.delete.useMutation({
    onSuccess: () => {
      refetch();
      alert('User deleted successfully!');
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const userData = {
      email: formData.email,
      name: formData.name,
      age: formData.age ? parseInt(formData.age) : undefined,
      bio: formData.bio || undefined,
    };

    if (editingId) {
      updateMutation.mutate({
        id: editingId,
        ...userData,
      });
    } else {
      createMutation.mutate(userData);
    }
  };

  const handleEdit = (user: any) => {
    setEditingId(user.id);
    setFormData({
      name: user.name,
      email: user.email,
      age: user.age?.toString() || '',
      bio: user.bio || '',
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      deleteMutation.mutate({ id });
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({ name: '', email: '', age: '', bio: '' });
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1>User Management</h1>
      <p>Full CRUD example with FIRM validation and tRPC</p>

      {/* Search */}
      <div style={{ marginBottom: '2rem' }}>
        <input
          type="text"
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            padding: '0.5rem',
            width: '100%',
            maxWidth: '400px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      {/* Form */}
      <div style={{ marginBottom: '2rem', padding: '1.5rem', background: '#f9f9f9', borderRadius: '8px' }}>
        <h2>{editingId ? 'Edit User' : 'Create New User'}</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              style={{
                padding: '0.5rem',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Email *
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              style={{
                padding: '0.5rem',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Age (optional, min: 18)
            </label>
            <input
              type="number"
              value={formData.age}
              onChange={(e) => setFormData({ ...formData, age: e.target.value })}
              min="18"
              max="120"
              style={{
                padding: '0.5rem',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem' }}>
              Bio (optional, max: 500 chars)
            </label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              maxLength={500}
              rows={3}
              style={{
                padding: '0.5rem',
                width: '100%',
                border: '1px solid #ccc',
                borderRadius: '4px',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              type="submit"
              disabled={createMutation.isLoading || updateMutation.isLoading}
              style={{
                padding: '0.5rem 1.5rem',
                background: '#0070f3',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              {editingId ? 'Update' : 'Create'} User
            </button>

            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '0.5rem 1.5rem',
                  background: '#666',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      {/* User List */}
      <div>
        <h2>Users ({data?.total || 0})</h2>

        {isLoading ? (
          <p>Loading users...</p>
        ) : data?.items.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            {data?.items.map((user) => (
              <div
                key={user.id}
                style={{
                  padding: '1rem',
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <h3 style={{ margin: '0 0 0.5rem 0' }}>{user.name}</h3>
                    <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>
                      📧 {user.email}
                    </p>
                    {user.age && (
                      <p style={{ margin: '0 0 0.25rem 0', color: '#666' }}>
                        🎂 {user.age} years old
                      </p>
                    )}
                    {user.bio && (
                      <p style={{ margin: '0.5rem 0 0 0', color: '#333' }}>
                        {user.bio}
                      </p>
                    )}
                    <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#999' }}>
                      Created: {new Date(user.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(user)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#0070f3',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      disabled={deleteMutation.isLoading}
                      style={{
                        padding: '0.25rem 0.75rem',
                        background: '#dc2626',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
