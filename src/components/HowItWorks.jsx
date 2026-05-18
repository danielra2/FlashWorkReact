const steps = [
  {
    number: '01',
    title: 'Create your profile',
    description: 'Sign up in under a minute. No CV, no lengthy forms.',
  },
  {
    number: '02',
    title: 'Browse open shifts',
    description: 'See available jobs near you with hourly rate and schedule.',
  },
  {
    number: '03',
    title: 'Apply and get hired',
    description: 'One tap to apply. Employers confirm the same day.',
  },
]

function HowItWorks() {
  return (
    <section className="px-8 py-20 max-w-5xl mx-auto">
      <h2 className="text-2xl font-bold text-center mb-16">
        How it works
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
        {steps.map((step) => (
          <div key={step.number} className="flex flex-col gap-3">
            <span className="text-blue-500 text-4xl font-bold">
              {step.number}
            </span>
            <h3 className="text-lg font-semibold">{step.title}</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              {step.description}
            </p>
          </div>
        ))}
      </div>
    </section>
  )
}

export default HowItWorks