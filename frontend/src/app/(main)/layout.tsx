// src/app/(main)/layout.tsx
import Sidebar from '../../components/SideBar';
// ... other imports

export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <main className="flex-1 p-4 overflow-y-auto md:p-6">
         {children} {/* The content of page.tsx (or nested routes) goes here */}
      </main>
    </div>
  );
}