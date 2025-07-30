import { BackButton } from '@/components/shared/BackButton'
import React from 'react'

export default function PrivacyPolicyPage() {
  return (
    <>
    <div className="container mx-auto py-12 px-4 max-w-3xl">
     <BackButton />
        <div className="disclaimer">
            <strong>Last Updated: July 3, 2025.</strong><br/>
            will comtact and take review by a legal professional to ensure full compliance with Indian law.
        </div>

            <h1 className="title">Privacy Policy for Passitpal</h1>
            <p>We value your privacy. This policy outlines how we collect, use, and protect your personal information.</p>

            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, such as when you create an account, create a listing, or communicate with other users. This includes: Name, Username, Email, Mobile Number, Location/City, and any images you upload.</p>

            <h2>2. How We Use Your Information</h2>
            <p>To operate and improve the Passitpal platform; to facilitate communication between users; to process transactions (like ad promotions); to send you notifications; and for security purposes.</p>

            <h2>3. Data Sharing and Disclosure</h2>
            <p>We do not sell your personal data. Your information (like username and city) may be visible to other users on your public profile and listings. We may share data with third-party service providers (e.g., for cloud hosting, payment processing) under strict confidentiality agreements.</p>

            <h2>4. Data Security</h2>
            <p>We implement reasonable security measures to protect your information. However, no system is 100% secure.</p>

            <h2>5. Your Rights</h2>
            <p>You have the right to access, update, or delete your personal information through your profile settings or by contacting us.</p>

            <h2>6. Grievance Officer</h2>
            <p>In accordance with the Information Technology Act 2000, the name and contact details of the Grievance Officer are provided below: Varaprasad Kare, support@passitpal.com</p>
            </div>
    </>
  )
}
