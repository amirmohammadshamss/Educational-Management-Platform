export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-sans text-sm">
        <h1 className="text-4xl font-heading font-bold text-center mb-8">
          Plateforme de Gestion Éducative
        </h1>
        <p className="text-center text-gray-600 mb-12">
          Educational Management Platform - Coming Soon
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="font-heading font-semibold text-xl mb-2">Admin</h2>
            <p className="text-gray-600">
              Gestion complète du système
            </p>
          </div>
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="font-heading font-semibold text-xl mb-2">Enseignant</h2>
            <p className="text-gray-600">
              Panneau pour enseignants
            </p>
          </div>
          <div className="p-6 border rounded-lg hover:shadow-lg transition-shadow">
            <h2 className="font-heading font-semibold text-xl mb-2">Étudiant</h2>
            <p className="text-gray-600">
              Espace étudiant
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
