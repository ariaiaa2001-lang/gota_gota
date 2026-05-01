export default async function TestPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">Probando ID: {id}</h1>
      <p>Si ves esto, la ruta está bien. El error era la consulta a la base de datos.</p>
    </div>
  )
}
