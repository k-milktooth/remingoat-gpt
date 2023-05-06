import Navbar from "@/components/navbar";

export default function Layout({ children }) {
  return (
    <div className="bg-neutral-800 text-white lg:px-12 xl:px-20 px-6">
      <Navbar />

      <main className="mx-auto min-h-screen">{children}</main>

      {/*
      <Footer />
      */}
    </div>
  );
}
