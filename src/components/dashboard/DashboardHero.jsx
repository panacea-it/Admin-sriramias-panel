export default function DashboardHero() {
  return (
    <section className="rounded-2xl bg-gradient-to-r from-[#00aeef] via-[#8e94b5] to-[#f07d7d] px-6 py-7 shadow-[0_8px_24px_rgba(0,174,239,0.2)] sm:px-8 sm:py-8 lg:px-10 lg:py-9">
      <h1 className="text-2xl font-black uppercase leading-none tracking-tight text-white sm:text-3xl lg:text-4xl">
        SUPER ADMIN DASHBOARD
      </h1>

      <p className="mt-2 whitespace-nowrap text-sm font-normal text-white sm:mt-2.5 sm:text-base">
        Manage all centers, monitor performance, and make data-driven decisions
        across{' '}
        <span className="font-bold text-[#0a2472]">3 centers</span> with{' '}
        <span className="font-bold text-[#0a2472]">2,847 students</span>
      </p>
    </section>
  )
}
