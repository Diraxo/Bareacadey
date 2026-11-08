import React, { useState } from 'react'
import { useDispatch } from 'react-redux';
import { setAlert } from '../../../../app/slices/commonSlice';
import { useAddContactMutation } from '../../../../features/main/contactsApiSlice';

const ContactUs = () => {
  const dispatch = useDispatch();
  const [addContact, { isLoading }] = useAddContactMutation();

  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    company_name: '',
    message: '',
    countryCode: '+252'
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = {
        _full_name: formData.full_name,
        _email: formData.email,
        _phone: formData.countryCode + '-' + formData.phone,
        _company_name: formData.company_name,
        _message: formData.message,
      };
      const data = await addContact(submitData).unwrap();
      if (data.message === "Successfully Created") {
        dispatch(setAlert({
          openAlert: true,
          severity: "success",
          message: data?.message,
          autoHideDuration: 5000,
          vertical: "top",
          horizontal: "right",
        }));
        setFormData({
          full_name: '',
          email: '',
          phone: '',
          company_name: '',
          message: '',
          countryCode: '+252'
        });
      }
    } catch (error) {
      dispatch(setAlert({
        openAlert: true,
        severity: "error",
        message: "Something went wrong",
        autoHideDuration: 5000,
        vertical: "top",
        horizontal: "right"
      }));
    }
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Get in Touch
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>

        <div className="mt-12 bg-white py-8 px-6 border border-gray-300 shadow-xl rounded-lg sm:px-10 transform transition duration-500 hover:scale-[1.02]">
          <form onSubmit={handleSubmit} className="mb-0 space-y-6">
            <div>
              <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                Full Name *
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="full_name"
                  id="full_name"
                  required
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email *
              </label>
              <div className="mt-1">
                <input
                  type="email"
                  name="email"
                  id="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <div className="mt-1 flex">
                <select
                  value={formData.countryCode}
                  onChange={(e) => setFormData({ ...formData, countryCode: e.target.value })}
                  className="w-24 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                >
                  <option value="+252">+252</option>
                  <option value="+251">+251</option>
                  <option value="+253">+253</option>
                  <option value="+254">+254</option>
                </select>
                <input
                  type="tel"
                  name="phone"
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-r-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="company_name" className="block text-sm font-medium text-gray-700">
                Company Name
              </label>
              <div className="mt-1">
                <input
                  type="text"
                  name="company_name"
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="message" className="block text-sm font-medium text-gray-700">
                Message *
              </label>
              <div className="mt-1">
                <textarea
                  name="message"
                  id="message"
                  rows="4"
                  required
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-[#1ea966] focus:border-[#1ea966] transition duration-200"
                ></textarea>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-[#1ea966] hover:bg-[#1a9459] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1ea966] transition duration-200 ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {isLoading ? 'Sending...' : 'Send Message'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

export default ContactUs