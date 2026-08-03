"use client";

import React from "react";
import { Mail, Phone, MapPin, Clock, Compass, HelpCircle, MessageSquare } from "lucide-react";
import { ContactForm } from "../../src/components/shared/ContactForm";
import img1 from "../.././src/assets/images/wen 23.png"


export default function ContactPage() {
  const contacts = [
    {
      icon: <Mail className="w-5 h-5 text-[#C9A227] stroke-[1.5]" />,
      title: "Active Support Helpline",
      value: "care@wenhairskin.com",
      desc: "Expect detailed personalized consultation answers within 3 business hours."
    },
    {
      icon: <Phone className="w-5 h-5 text-[#C9A227] stroke-[1.5]" />,
      title: "Direct WhatsApp Line",
      value: "+92 315 4455928",
      desc: "Send high-resolution photos or voice notes of skin layers for diagnostic review."
    },
    {
      icon: <MapPin className="w-5 h-5 text-[#C9A227] stroke-[1.5]" />,
      title: "Himalayan Distillation Lab",
      value: "DHA Phase 6, Karachi, Pakistan",
      desc: "Our boutique botanical cold-pressed processing facility."
    },
    {
      icon: <Clock className="w-5 h-5 text-[#C9A227] stroke-[1.5]" />,
      title: "Apothecary Lab Hours",
      value: "Mon - Sun, Open 24 Hours",
      desc: "Closed on gazetted National Pakistani holidays and religious festivals."
    }
  ];

  return (
    <div className="bg-white min-h-screen font-sans text-left relative overflow-hidden" id="contact-delivery-root">
      {/* Structural background aesthetics */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#1F4D3A]/2 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-24 left-0 w-96 h-96 bg-[#C9A227]/3 rounded-full blur-3xl pointer-events-none" />

      {/* Hero Banner with Dark green overlay frame */}
      <div 
        className="w-full h-[50vh] relative flex items-center justify-center bg-cover bg-center text-center px-4"
        style={{
          backgroundImage: `url(${img1})`
        }}
      >
        <div className="absolute inset-0 bg-[#0E1B15]/60" />
        <div className="relative z-10 max-w-4xl space-y-3">
          <span className="text-[#C9A227] text-xs font-bold uppercase tracking-[0.3em] block drop-shadow-md">
            We are here to assist you
          </span>
          <h1 className="font-playfair text-4xl sm:text-5xl font-extrabold text-white tracking-wide drop-shadow-md">
            Connect With Wen
          </h1>
          <p className="text-sm font-light text-gray-200 max-w-lg mx-auto leading-relaxed drop-shadow-md">
            Have questions about hard-water scalp irritation, hair thinning, or custom botanical routines? Write us below.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        {/* Contact content split layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 sm:gap-16 items-start">
          
          {/* Contact form on Left column */}
          <div className="lg:col-span-7">
            <ContactForm />
          </div>

          {/* Contact details coordinates grid on Right column */}
          <div className="lg:col-span-5 space-y-4">
            <div>
              <span className="text-[#C9A227] text-xs font-bold uppercase tracking-widest block font-mono">
                Support Desk coordinates
              </span>
              <h2 className="font-playfair text-2.5xl font-bold text-[#1F4D3A] mt-1">
                Apothecary Helplines
              </h2>
            </div>

            <div className="grid grid-cols-1 gap-4 pt-2">
              {contacts.map((contact, index) => (
                <div 
                  key={index} 
                  className="p-5.5 bg-[#F7F2EA]/40 border border-[#E8E1D3]/50 rounded-2xl flex items-start gap-4 hover:bg-[#F7F2EA]/60 transition"
                >
                  <div className="p-3 bg-white rounded-xl shadow-xs border border-[#E8E1D3]/30">
                    {contact.icon}
                  </div>
                  <div className="space-y-1">
                    <strong className="text-[10px] uppercase font-bold text-[#1F4D3A] tracking-wider block font-mono">
                      {contact.title}
                    </strong>
                    <p className="text-sm font-bold text-[#2C2C2C]">
                      {contact.value}
                    </p>
                    <p className="text-[11px] text-gray-500 font-light leading-relaxed">
                      {contact.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Embedded grayscale styled map locating DHA Phase 6 Karachi Headquarters */}
        <div className="space-y-4 pt-10">
          <div className="flex items-center gap-2.5 text-[#1F4D3A]">
            <Compass className="w-5.5 h-5.5 text-[#C9A227]" />
            <h3 className="font-playfair text-xl font-bold">Discover our Karachi Lab</h3>
          </div>
          <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-gray-150 shadow-sm bg-gray-100">
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d28975.65984361578!2d67.06170845!3d24.796909449999998!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3eb33cee4dd09493%3A0x780d79f26f44dd07!2sD.H.A%20Phase%206%20Defence%20Housing%20Authority%2C%20Karachi%2C%2075500%2C%20Pakistan!5e0!3m2!1sen!2s!4v1783281078170!5m2!1sen!2s"
              width="100%"
              height="100%"
              style={{ border: 0, filter: "grayscale(1) contrast(1.1) brightness(0.95)" }}
              allowFullScreen={true}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Wen DHA Karachi Lab Headquarters Map"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
