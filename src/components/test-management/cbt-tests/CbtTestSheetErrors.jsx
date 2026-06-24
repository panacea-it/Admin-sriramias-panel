export default function CbtTestSheetErrors({ errors = [] }) {
  if (!errors.length) return null

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-red-200 bg-red-50/80">
      <div className="border-b border-red-200 px-4 py-3">
        <h3 className="text-sm font-bold text-red-800">Question sheet validation errors</h3>
        <p className="mt-0.5 text-xs text-red-700">Fix these rows in your Excel file and upload again.</p>
      </div>
      <div className="max-h-48 overflow-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-red-100/60 text-xs font-semibold uppercase text-red-900">
            <tr>
              <th className="px-4 py-2">Row</th>
              <th className="px-4 py-2">Message</th>
            </tr>
          </thead>
          <tbody>
            {errors.map((err, idx) => (
              <tr key={`${err.row}-${idx}`} className="border-t border-red-100">
                <td className="px-4 py-2 font-mono text-red-900">{err.row}</td>
                <td className="px-4 py-2 text-red-800">{err.message}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
