'use client';

import React, { useEffect, useState } from 'react';
import { getToken, logoutUser } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useRouter } from 'next/navigation';

import { API_BASE } from '@/lib/config';


interface Position {
  position_id?: number;
  position_code: string;
  position_name: string;
}


interface TeamMemberDisplay extends Position {

  
  department: string; 
  salary: string; 
  location: string; 
  status: string; 
}

export default function DashboardPage() {
  const router = useRouter();
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // --- FORM STATE VARIABLES (C) ---
  const [employeeID, setEmployeeID] = useState(''); 
  const [name, setName] = useState(''); 
  const [editingId, setEditingId] = useState<number | null>(null);

  // New state for custom fields
  const [department, setDepartment] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');
  const [status, setStatus] = useState('');

  // Check authentication and load initial data
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push('/login');
      return;
    }
    fetchPositions();
  }, []); // eslint-disable-line

  function authHeaders() {
    const token = getToken();
    return {
      'Content-Type': 'application/json',
      Authorization: token ? `Bearer ${token}` : '',
    };
  }

  // GET positions (Read)
  async function fetchPositions() {
    setLoading(true);
    setError(null);
    try {
      // NOTE: Endpoint remains /positions
      const res = await fetch(`${API_BASE}/positions`, {
        method: 'GET',
        headers: authHeaders(),
      });

      if (res.status === 401) {
        logoutUser();
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      const data = await res.json();

      setPositions(data.data ?? data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch team data');
    } finally {
      setLoading(false);
    }
  }

  // Create or Update position
  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    // --- CRITICAL: PAYLOAD ONLY CONTAINS THE FIELDS THE BACKEND ACCEPTS ---
    const payload: Position = {
      position_code: employeeID, // Mapped employeeID to backend 'position_code'
      position_name: name, // Mapped name to backend 'position_name'
      // department, salary, location, and status are IGNORED in the request payload
    };

    try {
      let res: Response;

      if (editingId) {
        res = await fetch(`${API_BASE}/positions/${editingId}`, {
          method: 'PUT',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`${API_BASE}/positions`, {
          method: 'POST',
          headers: authHeaders(),
          body: JSON.stringify(payload),
        });
      }

      if (res.status === 401) {
        logoutUser();
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error(`Operation failed: ${res.status}`);

      await fetchPositions();
      handleCancelEdit();
    } catch (e: any) {
      setError(e.message || 'Operation failed');
    }
  }

  function startEdit(position: Position) {
    setEditingId(position.position_id || null);
    setEmployeeID(position.position_code); 
    setName(position.position_name); 
    
    
    setDepartment('');
    setSalary('');
    setLocation('');
    setStatus('');
  }

  function handleCancelEdit() {
    setEditingId(null);
    setEmployeeID('');
    setName('');
    
   
    setDepartment('');
    setSalary('');
    setLocation('');
    setStatus('');
  }

  // DELETE
  async function handleDelete(id?: number) {
    if (!id) return; 
    setError(null);

    try {
      const res = await fetch(`${API_BASE}/positions/${id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });

      if (res.status === 401) {
        logoutUser();
        router.push('/login');
        return;
      }

      if (!res.ok) throw new Error(`Delete failed: ${res.status}`);

      await fetchPositions();
    } catch (e: any) {
      setError(e.message || 'Delete failed');
    }
  }

  // --- MAPPING FUNCTION FOR DISPLAY ---
  const mapToDisplay = (p: Position): TeamMemberDisplay => ({
    ...p,
    // Provide visually compelling placeholders for the new columns
    department: "Engineering",
    salary: "$90,000",
    location: "Remote - Manila",
    status: (p.position_id ?? 0) % 2 === 0 ? "Active" : "On Leave", // Example conditional status
  });

  function handleLogout() {
    logoutUser();
    router.push('/login');
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Manager Team Dashboard</h1> 
          <div className="flex items-center gap-3">
            <Button variant="outline" className="w-full bg-blue-500 text-white"onClick={() => fetchPositions()}>Refresh</Button>
            <Button variant="destructive" onClick={handleLogout}>Logout</Button>
          </div>
        </header>

        {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

        <Card className="mb-6">
          <CardContent>
            <h2 className="text-lg font-semibold mb-2">
              {editingId ? 'Edit Team Member Info' : 'Add New Team Member'}
            </h2>
        
            <form onSubmit={handleCreateOrUpdate} className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <Input
                placeholder="Employee ID" // Mapped from Position Code
                value={employeeID}
                onChange={(e) => setEmployeeID(e.target.value)}
                required
              />
              <Input
                placeholder="Name" // Mapped from Position Name
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
              <Input
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
              />
              <Input
                placeholder="Salary"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
              />
              <Input
                placeholder="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
              />
              <Input
                placeholder="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              />
              
              <div className="md:col-span-3 flex justify-start gap-2 pt-2">
                <Button type="submit">
                  {editingId ? 'Update' : 'Create'}
                </Button>
                {editingId && (
                  <Button variant="outline" type="button" onClick={handleCancelEdit}>
                    Cancel
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <section>
          <h2 className="text-lg font-semibold mb-2">
            Team Member List {loading && '(Loading...)'}
          </h2>

          <div className="overflow-x-auto bg-white rounded shadow">
            <table className="w-full text-left">
              <thead className="bg-slate-100">
                <tr>
                  <th className="px-4 py-2">ID</th>
                  <th className="px-4 py-2">Employee ID</th> 
                  <th className="px-4 py-2">Name</th> 
                  <th className="px-4 py-2">Department</th>
                  <th className="px-4 py-2">Salary</th> 
                  <th className="px-4 py-2">Location</th> 
                  <th className="px-4 py-2">Status</th> 
                  <th className="px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {positions.length === 0 && !loading && (
                  <tr>
                    <td colSpan={8} className="px-4 py-6 text-center text-sm text-slate-500">
                      No team members found.
                    </td>
                  </tr>
                )}

                {positions.map((p) => {
                  const displayData = mapToDisplay(p); // Map data for display
                  return (
                    <tr key={p.position_id ?? p.position_code} className="border-t">
                      <td className="px-4 py-2 align-top">{displayData.position_id}</td>
                      <td className="px-4 py-2 align-top">{displayData.position_code}</td>
                      <td className="px-4 py-2 align-top">{displayData.position_name}</td>
                      <td className="px-4 py-2 align-top">{displayData.department}</td>
                      <td className="px-4 py-2 align-top">{displayData.salary}</td>
                      <td className="px-4 py-2 align-top">{displayData.location}</td>
                      <td className="px-4 py-2 align-top">{displayData.status}</td>
                      <td className="px-4 py-2 align-top">
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => startEdit(p)}>
                            Edit
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDelete(p.position_id)}
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}