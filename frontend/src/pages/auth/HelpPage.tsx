import { BackButton } from '@/components/shared/BackButton'
import React from 'react'

export default function HelpPage() {
  return (
    <>
      <div className="container mx-auto py-4 px-4 max-w-4xl">
        <BackButton />
    <h1 className="text-4xl font-bold mb-12 text-center">Help Center & Safety Guide</h1>

    {/* Safety Guide Section */}
    <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-lg mb-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Your Safety is Our Priority</h2>
        <p className="mb-4">Passitpal is a platform that connects you with other users. The final transaction happens directly between you and the other party. Please follow these essential tips to ensure a safe and secure deal:</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Verify Before You Pay:</strong> Always verify the pass or ticket details directly with the service provider (gym, event organizer) <span className='font-medium'>before</span> making any payment.</li>
            <li><strong>Use Secure Chat:</strong> Keep all conversations within the Passitpal chat system. Do not share personal contact details like your phone number or home address until you are comfortable.</li>
            <li><strong>Never Share Financial Information:</strong> Never share your bank account details, UPI ID, or credit card information in the chat. Arrange for payment using a secure method of your choice <span className='font-medium'>after</span> verifying the item.</li>
            <li><strong>Check User Reviews:</strong> Always check the seller's profile for their rating and reviews from past transactions.</li>
            <li><strong>Report Suspicious Activity:</strong> If something feels wrong, it probably is. Use the "Report" button on listings or profiles to alert our team immediately.</li>
        </ul>
    </div>

</div>
    </>
  )
}
