export default function Layout({ children }) {
  return (
    <>
      {/* <Navbar />
       */}

      <main className="mx-auto mb-12 min-h-screen bg-white px-6 pt-4 text-dark-green lg:px-12 xl:px-20">
        {children}
      </main>

      {/*
      <Footer />
      */}
    </>
  );
}
