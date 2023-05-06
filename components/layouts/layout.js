export default function Layout({ children }) {
  return (
    <>
      {/* <Navbar />
       */}

      <main className="mx-auto min-h-screen px-6 pt-4 lg:px-12 xl:px-20 bg-neutral-800 text-white">
        {children}
      </main>

      {/*
      <Footer />
      */}
    </>
  );
}
