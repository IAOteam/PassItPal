import { BackButton } from '@/components/shared/BackButton'
import React from 'react'

export default function ContactPage() {
  return (
    <>
    <div className="container mx-auto py-16 px-4 max-w-2xl">
        <BackButton />
    <h1 className="text-4xl font-bold mb-4 text-center">Get In Touch</h1>
        <p className="text-lg text-muted-foreground mb-12 text-center">
            We're here to help! Whether you have a question, a suggestion, or a business inquiry, please don't hesitate to reach out.
        </p>

    <div className="bg-card p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-semibold mb-6">Contact Channels</h2>
        <div className="space-y-4">
        <div>
            <h3 className="font-semibold">General Support & User Inquiries</h3>
            <p className="text-muted-foreground">For questions about listings, your account, or reporting a user.</p>
            <a href="mailto:support@passitpal.com" className="text-primary hover:underline">support@passitpal.com</a>
        </div>
        <div className="border-t pt-4">
            <h3 className="font-semibold">Business & Advertising Inquiries</h3>
            <p className="text-muted-foreground">For advertising opportunities and partnerships.</p>
            <a href="mailto:business@passitpal.com" className="text-primary hover:underline">business@passitpal.com</a>
        </div>
        <div className="border-t pt-4">
            <h3 className="font-semibold">Registered Address</h3>
            <p className="text-muted-foreground">3-15,NIPANI , ADILABAD, TELANGANA , 504312</p>
        </div>
        </div>
    </div>
    </div>
    </>
  )
}
