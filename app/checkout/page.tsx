"use client";

import React, { useState } from "react";
import { useShop } from "../../src/context/ShopContext";
import ProgressIndicator from "../../components/checkout/ProgressIndicator";
import OrderSummary from "../../components/checkout/OrderSummary";
import { ArrowLeft, ArrowRight, ShieldCheck, Mail, Phone, User, MapPin, Truck, ChevronDown, Check, X } from "lucide-react";

export default function CheckoutPage() {
  const { cart, directCheckoutItem, navigate, placeOrder, checkoutDetails, savedAddresses, addAddress, triggerToast, user, profile, appliedCoupon } = useShop();

  // Progress steps state: 1 (Info), 2 (Shipping method), 3 (Payment selector)
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);

  // Form parameters
  const [email, setEmail] = useState(checkoutDetails?.email || "");
  const [phone, setPhone] = useState(checkoutDetails?.phone || "");
  const [fullName, setFullName] = useState(checkoutDetails?.fullName || "");
  const [addressLine1, setAddressLine1] = useState(checkoutDetails?.address || "");
  const [addressLine2, setAddressLine2] = useState("");
  const [city, setCity] = useState(checkoutDetails?.city || "Lahore");
  const [country, setCountry] = useState("Pakistan");
  const [postalCode, setPostalCode] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [billingSameAsShipping, setBillingSameAsShipping] = useState(true);
  const [subscribeNews, setSubscribeNews] = useState(true);
  const [saveNewAddressToProfile, setSaveNewAddressToProfile] = useState(false);

  // Add New Address Modal States
  const [showAddAddressModal, setShowAddAddressModal] = useState(false);
  const [newAddrName, setNewAddrName] = useState("");
  const [newAddrPhone, setNewAddrPhone] = useState("");
  const [newAddrStreet, setNewAddrStreet] = useState("");
  const [newAddrCity, setNewAddrCity] = useState("Lahore");
  const [newAddrPostal, setNewAddrPostal] = useState("");
  const [newAddrInstructions, setNewAddrInstructions] = useState("");
  const [newAddrPrimary, setNewAddrPrimary] = useState(false);

  const PAKISTAN_CITIES = [
    "Lahore", "Karachi", "Islamabad", "Rawalpindi", "Peshawar", "Faisalabad", 
    "Multan", "Gujranwala", "Sialkot", "Quetta", "Hyderabad", "Bahawalpur", 
    "Sargodha", "Abbottabad", "Sukkur", "Larkana", "Sheikhupura", "Jhang", 
    "Rahim Yar Khan", "Gujrat", "Kasur", "Mardan", "Okara", "Sahiwal", 
    "Mingora", "Wah Cantonment", "Mirpur (AJK)", "Muzaffarabad (AJK)"
  ];

  // Pre-fill user data on mount / update
  React.useEffect(() => {
    if (user) {
      if (!email) {
        const clerkEmail = user.primaryEmailAddress?.emailAddress || user.emailAddress || "";
        if (clerkEmail) {
          setEmail(clerkEmail);
        }
      }
      if (!fullName) {
        const name = profile?.full_name || user?.fullName || "";
        if (name) {
          setFullName(name);
        }
      }
      if (!phone) {
        const phoneNum = profile?.phone || "";
        if (phoneNum) {
          setPhone(phoneNum);
        }
      }
      if (!addressLine1) {
        const addr = profile?.address || "";
        if (addr) {
          setAddressLine1(addr);
        }
      }
      if (!city && profile?.city) {
        setCity(profile.city);
      }
    }
  }, [user, profile]);

  // Auto-populate from primary saved address if available and fields are empty
  React.useEffect(() => {
    if (user && savedAddresses && savedAddresses.length > 0) {
      const primary = savedAddresses.find(a => a.is_primary) || savedAddresses[0];
      if (primary && !fullName && !addressLine1) {
        setFullName(primary.full_name);
        setAddressLine1(primary.address);
        setCity(primary.city);
        setCountry(primary.country || "Pakistan");
        setPostalCode(primary.postal_code || "");
        setSpecialInstructions(primary.special_instructions || "");
        if (primary.phone && !phone) {
          setPhone(primary.phone);
        }
      }
    }
  }, [user, savedAddresses]);

  // Delivery options: 'standard' (Free) vs 'express' (Rs. 200)
  const [deliveryMethod, setDeliveryMethod] = useState<"standard" | "express">("standard");
  const [paymentChoice, setPaymentChoice] = useState<"COD" | "RAPIDGATEWAY">("COD");
  
  // RapidGateway payment states
  const [isRapidGatewayProcessing, setIsRapidGatewayProcessing] = useState(false);
  const [rapidGatewayError, setRapidGatewayError] = useState<string | null>(null);
  const [selectedRapidMethod, setSelectedRapidMethod] = useState<string>('card'); // Default: card

  // RapidGateway Payment Methods Configuration
  const rapidMethods = [
    { id: 'card', name: 'Credit/Debit Card', description: 'Visa, Mastercard', icon: '💳' },
    { id: 'jazzcash', name: 'JazzCash', description: 'Mobile Wallet', icon: '📱' },
    { id: 'easypaisa', name: 'EasyPaisa', description: 'Mobile Wallet', icon: '📲' },
    { id: 'bank', name: 'Bank Transfer', description: 'Bank Al Habib', icon: '🏦' },
  ];

  // Error messages
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Summary collapsible on mobile
  const [summaryOpenMobile, setSummaryOpenMobile] = useState(false);

  // Calculations
  const checkoutCart = directCheckoutItem ? [directCheckoutItem] : cart;
  const subtotal = checkoutCart.reduce((acc, item) => acc + item.product.price * item.quantity, 0);
  const isEligibleForFreeShipping = subtotal >= 2000;
  
  // Calculate shipping cost
  const shippingCost = deliveryMethod === "express" 
    ? 200 
    : (isEligibleForFreeShipping ? 0 : 250);

  // Validations
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!email || !email.includes("@")) {
      newErrors.email = "Please supply a valid email address.";
    }
    const cleanPhone = phone.replace(/[-\s/()]/g, "");
    if (!/^03[0-9]{9}$/.test(cleanPhone)) {
      newErrors.phone = "Please enter valid Pakistani phone number (03XXXXXXXXX)";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!fullName || fullName.trim().length < 3) {
      newErrors.fullName = "Recipient name must be at least 3 characters.";
    }
    const cleanPhone = phone.replace(/[-\s/()]/g, "");
    if (!/^03[0-9]{9}$/.test(cleanPhone)) {
      newErrors.phone = "Please enter valid Pakistani phone number (03XXXXXXXXX)";
    }
    if (!addressLine1 || addressLine1.trim().length < 10) {
      newErrors.address = "Detailed street address is required.";
    }
    if (!city) {
      newErrors.city = "Please select or insert your city.";
    }
    if (!specialInstructions || specialInstructions.trim().length < 5) {
      newErrors.specialInstructions = "Special instructions are required (minimum 5 characters).";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNextStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep === 1) {
      if (validateStep1()) setCurrentStep(2);
    } else if (currentStep === 2) {
      if (validateStep2()) setCurrentStep(3);
    }
  };

  const handlePrevStep = (e: React.MouseEvent) => {
    e.preventDefault();
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('shop');
    }
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Login restriction check
    if (!user) {
      triggerToast("Login required to place an order.", undefined, undefined, "error");
      localStorage.setItem("redirectAfterLogin", "checkout");
      navigate("sign-in");
      return;
    }

    // Final review validation
    if (!validateStep1() || !validateStep2()) {
      return;
    }

    // Agar RapidGateway payment hai, toh alag flow hoga
    if (paymentChoice === "RAPIDGATEWAY") {
      await handleRapidGatewayPayment();
      return;
    }

    setIsProcessing(true);

    if (saveNewAddressToProfile && addAddress) {
      try {
        await addAddress({
          full_name: fullName,
          phone: phone,
          address: addressLine2 ? `${addressLine1}, ${addressLine2}` : addressLine1,
          city: city,
          country: country || "Pakistan",
          postal_code: postalCode || "",
          special_instructions: specialInstructions,
          is_primary: savedAddresses.length === 0
        });
      } catch (err) {
        console.warn("Could not auto-save address to profile:", err);
      }
    }

    try {
      await placeOrder({
        fullName,
        email,
        phone,
        address: addressLine2 ? `${addressLine1}, ${addressLine2}` : addressLine1,
        city,
        country: country || "Pakistan",
        postalCode,
        specialInstructions,
        billingSameAsShipping,
        paymentMethod: paymentChoice,
        notes: `Delivery Type: ${deliveryMethod === "express" ? "Express 2-3 Days" : "Standard 5-7 Days"}${subscribeNews ? " | Subscribe Newsletter" : ""}`,
        couponCode: appliedCoupon?.code || undefined,
        discountPercentage: appliedCoupon?.discount_value || undefined
      });
    } catch (err) {
      console.error("Order placement failed:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * RapidGateway Payment Handler - Phase 2 Implementation
   * Ye function RapidGateway ke through online payment initiate karta hai
   */
  const handleRapidGatewayPayment = async () => {
    setIsRapidGatewayProcessing(true);
    setRapidGatewayError(null);

    try {
      // Order ID generate karna (basket ID)
      const basketId = `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Total amount calculate karna
      const totalAmount = subtotal + shippingCost;

      console.log('[Checkout] Initiating RapidGateway payment:', {
        basketId,
        amount: totalAmount,
        email,
        phone,
        selectedMethod: selectedRapidMethod,
        environment: 'TEST'
      });

      // Backend API call karna
      const response = await fetch('/api/rapidgateway/initiate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: totalAmount,
          basketId,
          customerEmail: email,
          customerMobile: phone.replace(/[-\s/()]/g, ''),
          customerName: fullName,
          paymentMethod: selectedRapidMethod, // Selected method pass karna (card, jazzcash, easypaisa, bank)
          successUrl: `${window.location.origin}/order-success?order=${basketId}`,
          failureUrl: `${window.location.origin}/checkout?payment=failed&order=${basketId}`,
          checkoutUrl: window.location.origin,
          description: `Order ${basketId} - Wen Hair & Skin Secret`,
        }),
      });

      // Check if response is OK before parsing JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Payment initiation failed: ${response.status}`;
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // Response was not JSON, use status text
          if (errorText) {
            errorMessage = errorText.substring(0, 200);
          }
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();

      if (!result.redirectUrl) {
        throw new Error('No redirect URL received from payment gateway');
      }

      console.log('[Checkout] Payment initiated, redirecting to:', result.redirectUrl);

      // Customer ko RapidGateway hosted checkout page par redirect karna
      window.location.href = result.redirectUrl;

    } catch (error: any) {
      console.error('[Checkout] RapidGateway payment error:', error);
      const errorMsg = error.message || 'Payment initiation failed. Please try again.';
      setRapidGatewayError(errorMsg);
      triggerToast(
        errorMsg,
        '',
        '',
        'error'
      );
    } finally {
      setIsRapidGatewayProcessing(false);
    }
  };

  const handleAddNewAddressSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAddrName || !newAddrStreet || !newAddrCity || !newAddrPhone) {
      if (triggerToast) triggerToast("Please fill in all required fields.", "", "", "error");
      return;
    }

    const cleanPhone = newAddrPhone.replace(/[-\s/()]/g, "");
    if (!/^03[0-9]{9}$/.test(cleanPhone)) {
      if (triggerToast) triggerToast("Please enter a valid Pakistani mobile contact number (e.g. 03001234567).", "", "", "error");
      return;
    }

    setIsProcessing(true);
    try {
      const res = await addAddress({
        full_name: newAddrName,
        phone: newAddrPhone,
        address: newAddrStreet,
        city: newAddrCity,
        country: "Pakistan",
        postal_code: newAddrPostal,
        special_instructions: newAddrInstructions,
        is_primary: newAddrPrimary
      });

      if (res && res.success) {
        if (triggerToast) triggerToast("Address saved and activated!");
        
        // Auto-fill active checkout fields!
        setFullName(newAddrName);
        setAddressLine1(newAddrStreet);
        setCity(newAddrCity);
        setPhone(newAddrPhone);
        if (newAddrPostal) setPostalCode(newAddrPostal);
        if (newAddrInstructions) setSpecialInstructions(newAddrInstructions);

        // Clear address form
        setNewAddrName("");
        setNewAddrPhone("");
        setNewAddrStreet("");
        setNewAddrCity("Lahore");
        setNewAddrPostal("");
        setNewAddrInstructions("");
        setNewAddrPrimary(false);
        setShowAddAddressModal(false);
      } else {
        if (triggerToast) triggerToast(res?.error || "Could not save address.", "", "", "error");
      }
    } catch (err: any) {
      console.error("Add address error:", err);
      if (triggerToast) triggerToast("Error occurred while saving address.", "", "", "error");
    } finally {
      setIsProcessing(false);
    }
  };

  if (checkoutCart.length === 0) {
    return (
        <div className="py-24 text-center px-4 font-sans bg-[#F4EBDB] flex flex-col items-center justify-center min-h-[70vh]">
        <div className="p-4 bg-[#F7F2EA] text-[#1F4D3A] rounded-full mb-4">
          <Truck className="w-8 h-8" />
        </div>
        <h2 className="font-playfair text-2xl font-bold text-[#1F4D3A]">Your Saffron Bag is Empty</h2>
        <p className="text-[#757575] text-xs sm:text-sm mt-1 max-w-sm">
          Please select your premium hair or skin formulations from our boutique store before proceeding to checkout.
        </p>
        <button
          onClick={() => navigate('shop')}
          className="bg-[#1F4D3A] hover:bg-[#C9A227] text-white text-xs font-bold px-6 py-4 uppercase tracking-widest rounded-xl transition duration-300 shadow-md mt-6 cursor-pointer"
        >
          View Secret Formulations
        </button>
      </div>
    );
  }

  return (
    <div className="bg-[#F4EBDB] min-h-screen pb-20 pt-8 text-left font-sans" id="checkout-main-frame">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Back Link block */}
        <button
          onClick={() => navigate('shop')}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#757575] hover:text-[#1F4D3A] uppercase tracking-wider mb-6 transition"
          id="checkout-back-shop-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Apothecary Catalog</span>
        </button>

        {/* Dynamic Progress Timeline (Desktop / Large screen horizontal indicator) */}
        <div className="mb-10 block">
          <ProgressIndicator currentStep={currentStep} />
        </div>

        {/* Mobile Accordion Summary */}
        <div className="lg:hidden mb-6">
          <button 
            onClick={() => setSummaryOpenMobile(!summaryOpenMobile)}
            className="w-full bg-white border border-[#E8E1D3] p-4 rounded-2xl flex items-center justify-between text-xs font-bold text-[#254936] shadow-sm"
          >
            <span>Show Order Summary (Total: Rs. {(subtotal + shippingCost).toLocaleString()})</span>
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${summaryOpenMobile ? "rotate-180" : ""}`} />
          </button>
          
          {summaryOpenMobile && (
            <div className="mt-2.5">
              <OrderSummary 
                isProcessing={isProcessing} 
                shippingOptionCost={shippingCost} 
                onSubmitOrder={handlePlaceOrder}
                ctaText="Place Secret Order"
                canPlaceOrder={currentStep === 3}
              />
            </div>
          )}
        </div>

        {/* Core Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Side - 65% width */}
          <div className="lg:col-span-7 space-y-[32px]">
            
            {/* Step 1: Contact Credentials (Email, Phone) */}
            {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <span className="text-[12px] font-bold tracking-widest text-[#6b6b6b] uppercase block mb-2">
                    01 &mdash; Patron Coordinates
                  </span>
                  <h2 className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#1F4D3A]">
                    Contact Information
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* Email */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A] flex items-center gap-[4px]">
                      <Mail className="w-[14px] h-[14px] text-[#C9A227]" />
                      <span>Email address *</span>
                    </label>
                    <input 
                      type="email" 
                      placeholder="e.g. ali@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.email ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    {errors.email && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A] flex items-center gap-[4px]">
                      <Phone className="w-[14px] h-[14px] text-[#C9A227]" />
                      <span>Mobile Contact Number *</span>
                    </label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 0300 1234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.phone ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    <p className="text-[11px] text-[#6b6b6b] mt-[4px]">
                      📱 Order confirmations and invoice emails will be sent to the email and phone number provided here.
                    </p>
                    {errors.phone && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.phone}</p>}
                  </div>

                  {/* Checkbox offers */}
                  <div className="flex flex-col gap-3 pt-2 select-none">
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        id="confirmContact" 
                        required
                        className="w-4.5 h-4.5 rounded text-[#1F4D3A] focus:ring-[#C9A227] border-[#e5e5e5] cursor-pointer"
                      />
                      <label htmlFor="confirmContact" className="text-xs font-bold text-[#2C2C2C] cursor-pointer">
                        I confirm this is my active WhatsApp number and Email for order communications.
                      </label>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <input 
                        type="checkbox" 
                        id="subscribeNews" 
                        checked={subscribeNews}
                        onChange={(e) => setSubscribeNews(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-[#1F4D3A] focus:ring-[#C9A227] border-[#e5e5e5] cursor-pointer"
                      />
                      <label htmlFor="subscribeNews" className="text-xs font-medium text-[#757575] cursor-pointer">
                        Email me with private formulation launches and secret boutique coupons.
                      </label>
                    </div>
                  </div>
                </div>

                {/* Progress CTAs */}
                <div className="pt-6 border-t border-[#e5e5e5] flex items-center justify-between">
                  <span className="text-xs text-[#757575]">Step 1 of 3 (Contact Info)</span>
                  <button
                    onClick={handleNextStep}
                    className="px-[32px] py-[16px] bg-[#1F4D3A] hover:bg-[#1a4030] transition text-white font-bold text-[14px] uppercase tracking-wide rounded-[12px] cursor-pointer flex items-center justify-center shadow-md"
                  >
                    <span>Proceed to Address</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Coordinates (Postal directions and Deliveries) */}
            {currentStep === 2 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <span className="text-[12px] font-bold tracking-widest text-[#6b6b6b] uppercase block mb-2">
                    02 &mdash; Logistics Coordinates
                  </span>
                  <h2 className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#1F4D3A]">
                    Shipping Location & Methods
                  </h2>
                </div>

                {/* Saved Address Selection Panel */}
                {user ? (
                  savedAddresses && savedAddresses.length > 0 ? (
                    <div className="bg-[#1F4D3A]/5 p-5 border border-[#C9A227]/30 rounded-2xl space-y-3 text-left">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#E8E1D3] pb-3 mb-2">
                        <h4 className="text-xs font-bold text-[#1F4D3A] uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#C9A227]" />
                          <span>Select Saved Delivery Address</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => setShowAddAddressModal(true)}
                          className="text-[10px] font-extrabold text-[#C9A227] hover:text-[#1F4D3A] hover:bg-[#C9A227]/10 transition-colors uppercase tracking-widest flex items-center justify-center gap-1 bg-transparent border border-[#C9A227]/30 px-3 py-1.5 rounded-lg cursor-pointer focus:outline-none"
                        >
                          + Add New Address
                        </button>
                      </div>
                      <p className="text-[10px] text-[#757575] font-light leading-relaxed">
                        Choose one of your saved locations to automatically fill in the shipping coordinates below.
                      </p>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                        {savedAddresses.map((addr) => {
                          const isSelected = fullName === addr.full_name && addressLine1 === addr.address && city === addr.city;
                          return (
                            <button
                              key={addr.id}
                              type="button"
                              onClick={() => {
                                setFullName(addr.full_name);
                                setAddressLine1(addr.address);
                                setCity(addr.city);
                                if (addr.phone) {
                                  setPhone(addr.phone);
                                }
                                if (addr.postal_code) {
                                  setPostalCode(addr.postal_code);
                                } else {
                                  setPostalCode("");
                                }
                                if (addr.special_instructions) {
                                  setSpecialInstructions(addr.special_instructions);
                                } else {
                                  setSpecialInstructions("");
                                }
                                if (triggerToast) {
                                  triggerToast(`Loaded delivery address: ${addr.full_name}`);
                                }
                              }}
                              className={`p-4 border rounded-xl text-left transition-all flex flex-col justify-between cursor-pointer ${
                                isSelected 
                                  ? "border-2 border-[#C9A227] bg-[#F7F2EA] text-[#1F4D3A] shadow-xs" 
                                  : "border-[#e5e5e5] hover:border-[#e5e5e5] bg-white text-[#757575]"
                              }`}
                            >
                              <div className="space-y-1">
                                <span className="text-xs font-semibold text-[#2C2C2C] block">{addr.full_name}</span>
                                <span className="text-[10px] text-[#757575] block font-light line-clamp-1">{addr.address}</span>
                                <span className="text-[10px] text-[#757575] block font-medium">{addr.city}, Pakistan</span>
                              </div>
                              <span className="text-[9px] font-bold text-[#C9A227] mt-3 uppercase tracking-wider block">
                                {isSelected ? "✓ Active Shipping Target" : "Use This Address"}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-[#1F4D3A]/5 p-5 border border-dashed border-[#e5e5e5] rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-[#1F4D3A] uppercase tracking-wider flex items-center gap-1.5">
                          <MapPin className="w-4 h-4 text-[#C9A227]" />
                          <span>No Saved Delivery Addresses Found</span>
                        </h4>
                        <p className="text-[10px] text-[#757575] font-light leading-relaxed">
                          Save your delivery address for instant checkout across all your sessions.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowAddAddressModal(true)}
                        className="px-4 py-2 bg-[#1F4D3A] hover:bg-[#C9A227] text-white hover:text-white transition text-[10px] font-bold uppercase tracking-widest rounded-lg cursor-pointer flex items-center gap-1 focus:outline-none"
                      >
                        + Add Address
                      </button>
                    </div>
                  )
                ) : null}

                <div className="space-y-4">
                  {/* Region / Country */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A]">
                      <span>Region / Country *</span>
                    </label>
                    <select
                      value={country}
                      disabled
                      className="w-full px-[20px] py-[16px] bg-gray-50 border border-[#e5e5e5] rounded-[12px] text-[14px] font-medium cursor-not-allowed opacity-80"
                    >
                      <option value="Pakistan">Pakistan</option>
                    </select>
                  </div>

                  {/* Full Name */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A] flex items-center gap-[4px]">
                      <User className="w-[14px] h-[14px] text-[#C9A227]" />
                      <span>Recipient Full Name *</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Amna Malik"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.fullName ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    {errors.fullName && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Phone Number */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A] flex items-center gap-[4px]">
                      <Phone className="w-[14px] h-[14px] text-[#C9A227]" />
                      <span>Phone Number * (03XXXXXXXXX)</span>
                    </label>
                    <input 
                      type="tel" 
                      placeholder="e.g. 03001234567"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.phone ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    {errors.phone && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.phone}</p>}
                  </div>

                  {/* Address Grid */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A] flex items-center gap-[4px]">
                      <MapPin className="w-[14px] h-[14px] text-[#C9A227]" />
                      <span>Shipping Address *</span>
                    </label>
                    <input 
                      type="text" 
                      placeholder="e.g. Apartment, suite, unit, building, street, house number"
                      value={addressLine1}
                      onChange={(e) => setAddressLine1(e.target.value)}
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.address ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    {errors.address && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.address}</p>}
                  </div>

                  {/* Billing Address checkbox */}
                  <div className="flex items-center gap-2.5 pt-1 pb-2 select-none text-left">
                    <input 
                      type="checkbox" 
                      id="billingSameAsShipping" 
                      checked={billingSameAsShipping}
                      onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                      className="w-4.5 h-4.5 rounded text-[#1F4D3A] focus:ring-[#C9A227] border-[#e5e5e5] cursor-pointer"
                    />
                    <label htmlFor="billingSameAsShipping" className="text-xs font-semibold text-[#1F4D3A] cursor-pointer">
                      Billing Address same as Shipping
                    </label>
                  </div>

                  {/* City selection dropdown & postal code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-[6px] text-left">
                      <label className="text-[13px] font-semibold text-[#1F4D3A]">City *</label>
                      <div className="relative">
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="w-full px-[20px] py-[16px] bg-white border border-[#e5e5e5] rounded-[12px] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#1F4D3A] focus:border-[#1F4D3A] appearance-none cursor-pointer text-[#1a1a1a]"
                        >
                          {PAKISTAN_CITIES.map(c => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <ChevronDown className="w-[16px] h-[16px] text-[#6b6b6b] absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                    </div>

                    <div className="space-y-[6px] text-left">
                      <label className="text-[13px] font-semibold text-[#1F4D3A]">Postal Code (optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g. 43600"
                        value={postalCode}
                        onChange={(e) => setPostalCode(e.target.value)}
                        className="w-full px-[20px] py-[16px] bg-white border border-[#e5e5e5] rounded-[12px] text-[14px] focus:outline-none focus:ring-1 focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      />
                    </div>
                  </div>

                  {/* Special Instructions (Required) */}
                  <div className="space-y-[6px] text-left">
                    <label className="text-[13px] font-semibold text-[#1F4D3A]">
                      <span>Special Instructions * (Required)</span>
                    </label>
                    <textarea 
                      placeholder="e.g. Near main gate, call before arrival, ring bell twice..."
                      value={specialInstructions}
                      onChange={(e) => setSpecialInstructions(e.target.value)}
                      rows={3}
                      required
                      className={`w-full px-[20px] py-[16px] bg-white border rounded-[12px] text-[14px] focus:outline-none focus:ring-1 transition ${
                        errors.specialInstructions ? "border-rose-500 focus:ring-rose-500" : "border-[#e5e5e5] focus:border-[#1F4D3A] focus:ring-[#1F4D3A]"
                      }`}
                    />
                    {errors.specialInstructions && <p className="text-rose-500 text-[12px] font-bold mt-1">{errors.specialInstructions}</p>}
                  </div>

                  {/* Option to save this address to profile */}
                  {addAddress && (
                    <div className="flex items-center gap-2.5 pt-2 select-none text-left">
                      <input 
                        type="checkbox" 
                        id="saveNewAddress" 
                        checked={saveNewAddressToProfile}
                        onChange={(e) => setSaveNewAddressToProfile(e.target.checked)}
                        className="w-4.5 h-4.5 rounded text-[#1F4D3A] focus:ring-[#C9A227] border-[#e5e5e5] cursor-pointer"
                      />
                      <label htmlFor="saveNewAddress" className="text-xs font-semibold text-[#1F4D3A] cursor-pointer">
                        💾 Save this address to my profile for future apothecary orders
                      </label>
                    </div>
                  )}

                  {/* Delivery Standard / Express pricing metrics radio group */}
                  <div className="pt-4 space-y-3">
                    <h3 className="font-playfair text-lg font-bold text-[#1F4D3A]">
                      Select Sourcing & Shipping Method
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Standard Delivery */}
                      <label 
                        onClick={() => setDeliveryMethod("standard")}
                        className={`p-[20px] border rounded-[12px] flex items-center justify-between cursor-pointer transition ${
                          deliveryMethod === "standard" ? "border-2 border-[#1F4D3A] bg-white text-[#1F4D3A] font-bold" : "border-[#e5e5e5] bg-white text-[#6b6b6b] hover:border-[#1F4D3A]"
                        }`}
                      >
                        <div className="text-left">
                          <span className="text-xs font-bold block">Standard Delivery</span>
                          <span className="text-[10px] text-[#757575] font-light block mt-0.5">5-7 Business Days</span>
                          <span className="text-[10px] text-emerald-600 block mt-1 font-semibold">
                            {isEligibleForFreeShipping ? "FREE Delivery activated!" : "Rs. 250 Carriage"}
                          </span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          deliveryMethod === "standard" ? "border-[#C9A227] bg-[#C9A227]" : "border-[#e5e5e5]"
                        }`}>
                          {deliveryMethod === "standard" && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </label>

                      {/* Express Sourcing */}
                      <label 
                        onClick={() => setDeliveryMethod("express")}
                        className={`p-[20px] border rounded-[12px] flex items-center justify-between cursor-pointer transition ${
                          deliveryMethod === "express" ? "border-2 border-[#1F4D3A] bg-white text-[#1F4D3A] font-bold" : "border-[#e5e5e5] bg-white text-[#6b6b6b] hover:border-[#1F4D3A]"
                        }`}
                      >
                        <div className="text-left">
                          <span className="text-xs font-bold block">Express Sourcing</span>
                          <span className="text-[10px] text-[#757575] font-light block mt-0.5">2-3 Business Days</span>
                          <span className="text-[10px] text-[#C9A227] block mt-1 font-bold">Rs. 200</span>
                        </div>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          deliveryMethod === "express" ? "border-[#C9A227] bg-[#C9A227]" : "border-[#e5e5e5]"
                        }`}>
                          {deliveryMethod === "express" && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Navigation targets */}
                <div className="pt-6 border-t border-[#e5e5e5] flex items-center justify-between font-bold">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#1a1a1a] transition cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Coordinates</span>
                  </button>

                  <button
                    onClick={handleNextStep}
                    className="px-[32px] py-[16px] bg-[#1F4D3A] hover:bg-[#1a4030] transition text-white font-bold text-[14px] uppercase tracking-wide rounded-[12px] cursor-pointer flex items-center justify-center shadow-md"
                  >
                    <span>Proceed to Payments</span>
                    <ArrowRight className="w-4 h-4 text-[#C9A227]" />
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Secure Payments details (COD / Credit Direct Bank) */}
            {currentStep === 3 && (
              <div className="space-y-6 animate-fade-in-up">
                <div>
                  <span className="text-[12px] font-bold tracking-widest text-[#6b6b6b] uppercase block mb-2">
                    03 &mdash; Security Channels
                  </span>
                  <h2 className="font-playfair text-[28px] sm:text-[32px] font-bold text-[#1F4D3A]">
                    Sourcing Payment Gateway
                  </h2>
                </div>

                <div className="space-y-4">
                  {/* RapidGateway Error Display */}
                  {rapidGatewayError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700">
                      <p className="font-bold mb-1">⚠️ Payment Error</p>
                      <p>{rapidGatewayError}</p>
                      <button 
                        onClick={() => setRapidGatewayError(null)}
                        className="mt-2 text-xs underline font-semibold hover:text-red-900"
                      >
                        Dismiss
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Cash On Delivery */}
                    <label 
                      onClick={() => setPaymentChoice("COD")}
                      className={`p-[24px] border rounded-[12px] cursor-pointer transition text-left flex flex-col justify-between h-[140px] ${
                        paymentChoice === "COD" ? "border-2 border-[#1F4D3A] bg-white text-[#1F4D3A]" : "border-[#e5e5e5] bg-white text-[#6b6b6b] hover:border-[#1F4D3A]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">Cash on Delivery</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentChoice === "COD" ? "border-[#C9A227] bg-[#C9A227]" : "border-[#e5e5e5]"
                        }`}>
                          {paymentChoice === "COD" && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-[11px] text-[#757575] leading-normal font-light">
                        Pay our delivery courier in physical cash upon doorstep clearance. Great for general safety.
                      </p>
                    </label>

                    {/* RapidGateway Online Payment */}
                    <label 
                      onClick={() => setPaymentChoice("RAPIDGATEWAY")}
                      className={`p-[24px] border rounded-[12px] cursor-pointer transition text-left flex flex-col justify-between h-[160px] ${
                        paymentChoice === "RAPIDGATEWAY" ? "border-2 border-[#1F4D3A] bg-gradient-to-br from-white to-[#F7F2EA] text-[#1F4D3A]" : "border-[#e5e5e5] bg-white text-[#6b6b6b] hover:border-[#1F4D3A]"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider">Online Payment</span>
                        <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                          paymentChoice === "RAPIDGATEWAY" ? "border-[#C9A227] bg-[#C9A227]" : "border-[#e5e5e5]"
                        }`}>
                          {paymentChoice === "RAPIDGATEWAY" && <Check className="w-2.5 h-2.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <div className="space-y-1">
                        <p className="text-[10px] text-[#1F4D3A] leading-normal font-semibold">
                          💳 Cards / Wallets / Bank Transfer
                        </p>
                        <ul className="text-[9px] text-[#757575] leading-tight space-y-0.5">
                          <li>• Visa / Mastercard</li>
                          <li>• JazzCash / EasyPaisa</li>
                          <li>• Bank Al Habib Transfer</li>
                        </ul>
                        <p className="text-[9px] text-emerald-600 font-bold mt-1">
                          🔒 TEST MODE ACTIVE
                        </p>
                      </div>
                    </label>
                  </div>

                  {/* RapidGateway Payment Methods Info */}
                  {paymentChoice === "RAPIDGATEWAY" && (
                    <div className="p-5 bg-gradient-to-br from-[#F7F2EA] to-white border-2 border-[#C9A227]/30 rounded-2xl text-xs space-y-4 text-[#1F4D3A] transition animate-fade-in-up">
                      <div className="flex items-center gap-2 pb-2 border-b border-[#E8E1D3]">
                        <ShieldCheck className="w-5 h-5 text-[#C9A227]" />
                        <p className="font-bold text-sm uppercase tracking-wider">
                          Select Payment Method - Test Mode
                        </p>
                      </div>
                      
                      {/* Payment Method Selection Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {rapidMethods.map((method) => (
                          <label
                            key={method.id}
                            className={`relative flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                              selectedRapidMethod === method.id
                                ? 'border-[#1F4D3A] bg-gradient-to-br from-[#1F4D3A]/10 to-white shadow-md'
                                : 'border-[#E8E1D3] bg-white hover:border-[#C9A227] hover:shadow-sm'
                            }`}
                          >
                            <input
                              type="radio"
                              name="rapidPaymentMethod"
                              value={method.id}
                              checked={selectedRapidMethod === method.id}
                              onChange={(e) => setSelectedRapidMethod(e.target.value)}
                              className="absolute opacity-0 pointer-events-none"
                            />
                            <span className="text-2xl flex-shrink-0">{method.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className={`font-bold text-sm mb-0.5 ${
                                selectedRapidMethod === method.id ? 'text-[#1F4D3A]' : 'text-[#1F4D3A]'
                              }`}>
                                {method.name}
                              </p>
                              <p className="text-[10px] text-[#757575] leading-tight">
                                {method.description}
                              </p>
                            </div>
                            <div className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                              selectedRapidMethod === method.id
                                ? 'border-[#1F4D3A] bg-[#1F4D3A]'
                                : 'border-[#E8E1D3] bg-white'
                            }`}>
                              {selectedRapidMethod === method.id && (
                                <Check className="w-3 h-3 text-white stroke-[3]" />
                              )}
                            </div>
                          </label>
                        ))}
                      </div>

                      <div className="space-y-2 pt-2">
                        <p className="font-semibold text-[11px] uppercase tracking-wide text-[#1F4D3A]">
                          How it works:
                        </p>
                        <div className="text-[10px] text-[#757575] space-y-1">
                          <p>• Select your preferred payment method above</p>
                          <p>• Click "Place Order" to proceed to secure checkout</p>
                          <p>• Complete payment on RapidGateway's hosted page</p>
                          <p>• Return to this site after successful payment</p>
                        </div>
                      </div>

                      <div className="bg-[#1F4D3A]/5 border border-[#1F4D3A]/20 rounded-xl p-3 mt-3">
                        <p className="text-[10px] text-[#1F4D3A] leading-relaxed">
                          <strong className="block mb-1 text-[11px] uppercase tracking-wide">🧪 Sandbox Testing Active:</strong>
                          Ye TEST mode hai - koi real paisa deduct nahi hoga. Amount 100 PKR = Success, 200 PKR = Failed. 
                          Jab business verify hojayega aur Merchant ID milegi, tab LIVE mode activate hoga.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 pt-2 border-t border-[#E8E1D3]">
                        <div className="flex-1 h-1.5 bg-gradient-to-r from-[#1F4D3A] via-[#C9A227] to-[#1F4D3A] rounded-full"></div>
                        <span className="text-[9px] font-mono text-[#757575] uppercase">PCI-DSS Compliant</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Actions group */}
                <div className="pt-6 border-t border-[#e5e5e5] flex items-center justify-between font-bold">
                  <button
                    onClick={handlePrevStep}
                    className="flex items-center gap-1.5 text-xs text-[#757575] hover:text-[#1a1a1a] transition cursor-pointer bg-transparent outline-none border-none"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Sourcing Location</span>
                  </button>

                  <button
                    onClick={handlePlaceOrder}
                    disabled={isProcessing || isRapidGatewayProcessing}
                    className={`px-[32px] py-[16px] bg-[#1F4D3A] hover:bg-[#1a4030] transition text-white font-bold text-[14px] uppercase tracking-wide rounded-[12px] cursor-pointer flex items-center justify-center shadow-md disabled:opacity-50 ${
                      paymentChoice === "RAPIDGATEWAY" && isRapidGatewayProcessing ? "animate-pulse" : ""
                    }`}
                  >
                    {isProcessing || isRapidGatewayProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>{paymentChoice === "RAPIDGATEWAY" ? "Redirecting to Payment..." : "Processing Saffron Formulation..."}</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4.5 h-4.5 text-[#C9A227]" />
                        <span>{paymentChoice === "RAPIDGATEWAY" ? "Proceed to Secure Payment" : "Place Direct Order"}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Summary Viewport - Sticky 35% Column */}
          <div className="hidden lg:block lg:col-span-5">
            <OrderSummary 
              isProcessing={isProcessing} 
              shippingOptionCost={shippingCost} 
              onSubmitOrder={handlePlaceOrder}
              ctaText="Confirm Secret Sourcing"
              canPlaceOrder={currentStep === 3}
            />
          </div>

        </div>

      </div>

      {/* Add New Address Modal Overlay */}
      {showAddAddressModal && (
        <div className="fixed inset-0 bg-black/60 z-50 backdrop-blur-[3px] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#F7F2EA] border border-[#E8E1D3] rounded-3xl w-full max-w-lg p-6 sm:p-8 space-y-6 shadow-2xl relative font-sans text-[#1F4D3A] my-8 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddAddressModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-150 text-[#78716C] hover:text-[#1F4D3A] transition-colors cursor-pointer"
              type="button"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="text-left space-y-1">
              <span className="text-[9px] font-bold font-mono tracking-widest text-[#C9A227] uppercase block">
                COURIER ENROLLMENT
              </span>
              <h3 className="font-playfair text-xl sm:text-2xl font-bold text-[#1F4D3A]">
                Add New Delivery Address
              </h3>
              <p className="text-[11px] text-[#757575] font-light">
                Fill in standard Pakistani postal details for secure, high-priority courier dispatch.
              </p>
            </div>

            <form onSubmit={handleAddNewAddressSubmit} className="space-y-4 text-left">
              {/* Full Name */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1">
                  <User className="w-3 h-3 text-[#C9A227]" />
                  <span>Recipient Full Name *</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAddrName}
                  onChange={(e) => setNewAddrName(e.target.value)}
                  placeholder="e.g. Ayesha Khan"
                  className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1">
                  <Phone className="w-3 h-3 text-[#C9A227]" />
                  <span>Mobile Phone Number *</span>
                </label>
                <input
                  type="tel"
                  required
                  value={newAddrPhone}
                  onChange={(e) => setNewAddrPhone(e.target.value)}
                  placeholder="e.g. 03001234567"
                  className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                />
              </div>

              {/* Shipping Address */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#C9A227]" />
                  <span>Detailed Shipping Address *</span>
                </label>
                <input
                  type="text"
                  required
                  value={newAddrStreet}
                  onChange={(e) => setNewAddrStreet(e.target.value)}
                  placeholder="e.g. House 45-B, Sector Z, Phase 6, DHA"
                  className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                />
              </div>

              {/* City Selection and Postal */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A]">City *</label>
                  <div className="relative">
                    <select
                      value={newAddrCity}
                      onChange={(e) => setNewAddrCity(e.target.value)}
                      className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227] appearance-none cursor-pointer text-[#2C2C2C] font-bold"
                    >
                      {PAKISTAN_CITIES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-[#757575] absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A]">Postal Code (optional)</label>
                  <input
                    type="text"
                    value={newAddrPostal}
                    onChange={(e) => setNewAddrPostal(e.target.value)}
                    placeholder="e.g. 54000"
                    className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                  />
                </div>
              </div>

              {/* Special Instructions */}
              <div className="space-y-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-[#1F4D3A]">Special Instructions</label>
                <textarea
                  value={newAddrInstructions}
                  onChange={(e) => setNewAddrInstructions(e.target.value)}
                  placeholder="e.g. Ring bell twice, call on arrival, drop with guard..."
                  rows={2}
                  className="w-full px-4 py-3 bg-white border border-[#e5e5e5] rounded-xl text-xs focus:outline-none focus:ring-1 focus:ring-[#C9A227] focus:border-[#C9A227]"
                />
              </div>

              {/* Set Primary */}
              <div className="flex items-center gap-2 py-1 select-none">
                <input
                  type="checkbox"
                  id="newAddrPrimary"
                  checked={newAddrPrimary}
                  onChange={(e) => setNewAddrPrimary(e.target.checked)}
                  className="w-4 h-4 rounded text-[#1F4D3A] border-[#e5e5e5] focus:ring-[#C9A227] cursor-pointer"
                />
                <label htmlFor="newAddrPrimary" className="text-xs font-semibold text-[#1F4D3A] cursor-pointer">
                  Set as primary shipping address
                </label>
              </div>

              {/* Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-150">
                <button
                  type="button"
                  onClick={() => setShowAddAddressModal(false)}
                  className="px-4 py-2.5 border border-[#E8E1D3] text-[#78716C] hover:text-[#1F4D3A] hover:bg-gray-50 transition text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer focus:outline-none"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-6 py-2.5 bg-[#1F4D3A] hover:bg-[#C9A227] text-white hover:text-white transition text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer focus:outline-none disabled:opacity-50 flex items-center gap-2"
                >
                  {isProcessing ? "Saving..." : "Save & Activate"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
