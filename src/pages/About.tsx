const About = () => {
  const teamMembers = [
    {
      name: 'John Doe',
      role: 'Frontend Developer',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      description: 'Expert in React, TypeScript, and modern web technologies.'
    },
    {
      name: 'Jane Smith',
      role: 'UI/UX Designer',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      description: 'Passionate about creating beautiful and intuitive user experiences.'
    },
    {
      name: 'Mike Johnson',
      role: 'Backend Developer',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      description: 'Specialized in scalable backend solutions and API development.'
    }
  ]

  const technologies = [
    { name: 'React', icon: '⚛️', description: 'Modern UI library for building interactive user interfaces' },
    { name: 'TypeScript', icon: '📘', description: 'Typed superset of JavaScript for better development experience' },
    { name: 'Vite', icon: '⚡', description: 'Next-generation frontend tooling for fast development' },
    { name: 'Tailwind CSS', icon: '🎨', description: 'Utility-first CSS framework for rapid UI development' }
  ]

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-6">
          About Smart Web
        </h1>
        <p className="text-xl text-gray-600 max-w-3xl mx-auto">
          We are passionate about creating modern, efficient, and user-friendly web applications 
          that leverage the latest technologies and best practices in web development.
        </p>
      </section>

      {/* Mission Section */}
      <section className="card">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">
            Our Mission
          </h2>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            To empower developers and businesses with cutting-edge web solutions that combine 
            performance, security, and exceptional user experience. We believe in the power of 
            modern web technologies to create applications that make a difference.
          </p>
        </div>
      </section>

      {/* Technologies Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Technologies We Use
          </h2>
          <p className="text-lg text-gray-600">
            Built with the most modern and reliable technologies available
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {technologies.map((tech, index) => (
            <div key={index} className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="text-4xl mb-4">{tech.icon}</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {tech.name}
              </h3>
              <p className="text-gray-600 text-sm">
                {tech.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Team Section */}
      <section>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Meet Our Team
          </h2>
          <p className="text-lg text-gray-600">
            Dedicated professionals committed to delivering excellence
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <div key={index} className="card text-center group hover:shadow-lg transition-shadow duration-300">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src={member.avatar} 
                  alt={member.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-1">
                {member.name}
              </h3>
              <p className="text-primary-600 font-medium mb-3">
                {member.role}
              </p>
              <p className="text-gray-600 text-sm">
                {member.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Values Section */}
      <section className="card">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Our Values
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Quality</h3>
            <p className="text-gray-600">We never compromise on quality in our deliverables</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Innovation</h3>
            <p className="text-gray-600">Always exploring new technologies and approaches</p>
          </div>
          
          <div className="text-center">
            <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Collaboration</h3>
            <p className="text-gray-600">Working together to achieve exceptional results</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default About
