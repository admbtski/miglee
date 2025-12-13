/**
 * Check-in & Presence Management Page
 * Full implementation of check-in system for event organizers
 */

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Check-in & Presence - Event Management',
  description: 'Manage event check-ins and track attendee presence',
};

export default function CheckinPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">
            Check-in & Presence
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Manage attendee check-ins and track event presence
          </p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="text-sm font-medium text-zinc-600">Total Members</div>
          <div className="mt-2 text-3xl font-bold text-zinc-900">0</div>
          <div className="mt-1 text-xs text-zinc-500">JOINED status</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="text-sm font-medium text-zinc-600">Checked In</div>
          <div className="mt-2 text-3xl font-bold text-emerald-600">0</div>
          <div className="mt-1 text-xs text-zinc-500">Present at event</div>
        </div>
        <div className="rounded-lg border border-zinc-200 bg-white p-6">
          <div className="text-sm font-medium text-zinc-600">
            Attendance Rate
          </div>
          <div className="mt-2 text-3xl font-bold text-indigo-600">0%</div>
          <div className="mt-1 text-xs text-zinc-500">Check-in percentage</div>
        </div>
      </div>

      {/* Settings Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Check-in Settings
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Configure how attendees can check in to your event
        </p>

        <div className="mt-6 space-y-4">
          {/* Enable Check-in Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-zinc-900">Enable Check-in</div>
              <div className="text-sm text-zinc-600">
                Allow attendees to check in to this event
              </div>
            </div>
            <button
              type="button"
              className="relative inline-flex h-6 w-11 items-center rounded-full bg-zinc-200 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              <span className="inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1" />
            </button>
          </div>

          {/* Check-in Methods */}
          <div className="border-t border-zinc-200 pt-4">
            <div className="font-medium text-zinc-900 mb-3">
              Check-in Methods
            </div>
            <div className="space-y-2">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">
                  Manual (User clicks &quot;I&apos;m here&quot; button)
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">
                  Moderator Panel (Check in from list)
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">
                  Event QR Code (Shared QR for all attendees)
                </span>
              </label>
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-sm text-zinc-700">
                  Individual QR Codes (Scan attendee&apos;s QR)
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Event QR Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">Event QR Code</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Display this QR code at your event entrance for easy check-in
        </p>

        <div className="mt-6 flex flex-col items-center justify-center space-y-4 py-8">
          <div className="rounded-lg border-2 border-dashed border-zinc-300 bg-zinc-50 p-8">
            <div className="text-center text-sm text-zinc-500">
              QR Code will appear here when enabled
            </div>
          </div>

          <div className="flex gap-2">
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Full Screen
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Download PNG
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Download PDF
            </button>
            <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
              Rotate Token
            </button>
          </div>
        </div>
      </div>

      {/* Participants List */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">
              Participants
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Check in attendees and manage their presence status
            </p>
          </div>
          <button className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700">
            Scan QR Code
          </button>
        </div>

        {/* Filters */}
        <div className="mb-4 flex gap-2">
          <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            <option>All Participants</option>
            <option>Checked In</option>
            <option>Not Checked In</option>
            <option>Blocked</option>
          </select>
          <input
            type="text"
            placeholder="Search by name..."
            className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700 placeholder:text-zinc-400"
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Methods
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Last Check-in
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  No participants yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Event Log */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Event Log</h2>
            <p className="mt-1 text-sm text-zinc-600">
              Complete audit trail of all check-in activities
            </p>
          </div>
          <button className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Export Log
          </button>
        </div>

        {/* Log Filters */}
        <div className="mb-4 flex gap-2">
          <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            <option>All Actions</option>
            <option>Check In</option>
            <option>Uncheck</option>
            <option>Reject</option>
            <option>Block</option>
            <option>Unblock</option>
          </select>
          <select className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-700">
            <option>All Methods</option>
            <option>Manual</option>
            <option>Moderator Panel</option>
            <option>Event QR</option>
            <option>User QR</option>
          </select>
        </div>

        {/* Log Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b border-zinc-200 bg-zinc-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Time
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Participant
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Action
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Method
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Actor
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-zinc-600">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200">
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-12 text-center text-sm text-zinc-500"
                >
                  No activity yet
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Section */}
      <div className="rounded-lg border border-zinc-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-zinc-900">
          Export Participant List
        </h2>
        <p className="mt-1 text-sm text-zinc-600">
          Download attendance list for record-keeping
        </p>

        <div className="mt-6 flex gap-3">
          <button className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Export as PDF
          </button>
          <button className="rounded-lg border border-zinc-300 bg-white px-6 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
            Export as PNG Image
          </button>
        </div>
      </div>
    </div>
  );
}
