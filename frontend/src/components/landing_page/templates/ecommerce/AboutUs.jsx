import React from 'react'
import { motion } from 'framer-motion'
import { FaGraduationCap, FaUsers, FaLaptop, FaShieldAlt, FaChalkboardTeacher, FaMobileAlt } from 'react-icons/fa'
import {useTheme} from "@mui/material/styles";
import { useMediaQuery } from '@mui/material';

const AboutUs = () => {
  const theme = useTheme();
  const sm = useMediaQuery(theme.breakpoints.down('sm'));
  const features = [
    {
      icon: <FaGraduationCap className="w-12 h-12 text-[#1ea966]" />,
      title: "Ethiopian Curriculum",
      description: "Aligned with Ethiopian educational standards and Somali region curriculum books for seamless learning integration"
    },
    {
      icon: <FaChalkboardTeacher className="w-12 h-12 text-[#1ea966]" />,
      title: "Expert Instructors",
      description: "Qualified teachers can register and share their expertise through custom courses tailored to students' needs"
    },
    {
      icon: <FaMobileAlt className="w-12 h-12 text-[#1ea966]" />,
      title: "24/7 Learning",
      description: "Access your courses anytime, anywhere through our mobile-friendly platform"
    },
    {
      icon: <FaShieldAlt className="w-12 h-12 text-[#1ea966]" />,
      title: "Secure & Private",
      description: "Your privacy matters - we maintain strict data protection while providing seamless learning experiences"
    },
    {
      icon: <FaLaptop className="w-12 h-12 text-[#1ea966]" />,
      title: "Flexible Learning",
      description: "Study at your own pace with our comprehensive digital learning resources and support"
    },
    {
      icon: <FaUsers className="w-12 h-12 text-[#1ea966]" />,
      title: "Free for Every Student",
      description: "Every course is free. Create an account and start learning right away"
    }
  ]

  const achievements = [
    {
      title: "Course Library",
      value: "15+",
      description: "Curriculum-aligned courses covering key subjects in the Ethiopian education system"
    },
    {
      title: "Registered Students",
      value: "1000+",
      description: "Students actively improving their academic performance through our platform"
    },
    {
      title: "Regional Impact",
      value: "100%",
      description: "Dedicated to enhancing education quality in the Somali region of Ethiopia"
    }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative py-20 rounded-md bg-gradient-to-br from-emerald-700 via-[#1ea966] to-emerald-500 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />
        <div className="container mx-auto px-6 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center text-white max-w-4xl mx-auto"
          >
            <div className="mb-8 inline-block bg-white/10 backdrop-blur-sm px-8 py-4 rounded-full">
              <span className="text-lg font-semibold">Digital Learning Platform</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight drop-shadow-xl">
            Bridging Educational Gaps <br className="hidden md:block" />
              <span className="bg-clip-text text-transparent bg-gradient-to-r  from-emerald-200 to-white">
              Through Technology
              </span>
            </h1>
          </motion.div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 bg-gray-50">
        <div className="container mx-auto px-6">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-center"
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-8 text-gray-800 relative inline-block">
              Our Mission
              <div className="absolute -bottom-2 left-0 right-0 h-1 bg-[#1ea966] rounded-full transform scale-x-50 opacity-75"></div>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 leading-relaxed">
              At Bare Academy, we are dedicated to making quality education accessible to every student in the Somali region. 
              Our platform seamlessly integrates with the Ethiopian curriculum, providing students with 24/7 access to expert teachers 
              and comprehensive learning resources.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-6f">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800 relative inline-block w-full">
            Why Choose Bare Academy
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#1ea966] rounded-full opacity-75"></div>
          </h2>
          <div className={`grid-tl grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto ${sm ? '' : 'px-4'}`}>
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${sm ? 'p-3 py-5' : 'p-6'} bg-white rounded-xl border border-gray-300 shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 flex flex-col items-center text-center`}
              >
                <div className="mb-6 p-4 bg-[#f8fdfb] rounded-full shadow-md">{feature.icon}</div>
                <h3 className="text-2xl font-semibold mb-4 text-gray-800">{feature.title}</h3>
                <p className="text-gray-600 text-lg leading-relaxed flex-grow">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Achievements Section */}
      <section className="py-24 bg-gray-50">
        <div className={`${sm ? 'px-2' : 'px-3'} mx-auto px-6f`}>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-gray-800 relative inline-block w-full">
            Our Impact & Achievements
            <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-24 h-1 bg-[#1ea966] rounded-full opacity-75"></div>
          </h2>
          <div className={`grid-tl grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto justify-items-center ${sm ? '' : 'px-4'}`}>
            {achievements.map((achievement, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`${sm ? 'px-4 py-8' : 'py-8 px-6'} w-full max-w-md bg-white rounded-xl border border-gray-300 shadow-lg hover:shadow-xl transition-all duration-300 text-center group hover:-translate-y-2`}
              >
                <h3 className="text-5xl font-bold text-[#1ea966] mb-6 group-hover:scale-110 transition-transform">
                  {achievement.value}
                </h3>
                <h4 className="text-2xl font-semibold text-gray-800 mb-4">{achievement.title}</h4>
                <p className="text-gray-600 text-lg leading-relaxed">{achievement.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

export default AboutUs