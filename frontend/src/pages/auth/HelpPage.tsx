import { BackButton } from '@/components/shared/BackButton'
import React from 'react'

export default function HelpPage() {
  return (
    <>
      <div className="container mx-auto py-16 px-4 max-w-4xl">
        <BackButton />
    <h1 className="text-4xl font-bold mb-12 text-center">Help Center & Safety Guide</h1>

    {/* Safety Guide Section */}
    <div className="bg-destructive/10 border-l-4 border-destructive p-6 rounded-lg mb-12">
        <h2 className="text-2xl font-bold text-destructive mb-4">Your Safety is Our Priority</h2>
        <p className="mb-4">Passitpal is a platform that connects you with other users. The final transaction happens directly between you and the other party. Please follow these essential tips to ensure a safe and secure deal:</p>
        <ul className="list-disc list-inside space-y-2">
            <li><strong>Verify Before You Pay:</strong> Always verify the pass or ticket details directly with the service provider (gym, event organizer) *before* making any payment.</li>
            <li><strong>Use Secure Chat:</strong> Keep all conversations within the Passitpal chat system. Do not share personal contact details like your phone number or home address until you are comfortable.</li>
            <li><strong>Never Share Financial Information:</strong> Never share your bank account details, UPI ID, or credit card information in the chat. Arrange for payment using a secure method of your choice *after* verifying the item.</li>
            <li><strong>Check User Reviews:</strong> Always check the seller's profile for their rating and reviews from past transactions.</li>
            <li><strong>Report Suspicious Activity:</strong> If something feels wrong, it probably is. Use the "Report" button on listings or profiles to alert our team immediately.</li>
        </ul>
    </div>

    {/* FAQ Section */}
    <h2 className="text-3xl font-bold mb-6 text-center">Frequently Asked Questions</h2>

    {/* For Sellers */}
    <div>
        <h3 className="text-2xl font-semibold mb-4">For Sellers</h3>
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">How do I list my item?</h4>
                <p>Once your account is set to "Seller" mode, click on "List a Pass" in the navigation bar and fill out the simple form with details about your item.</p>
            </div>
            <div>
                <h4 className="font-semibold">How do I get paid?</h4>
                <p>Payment is arranged directly between you and the buyer. Once you both agree on the terms in the chat, you can decide on a mutual payment method (e.g., UPI, bank transfer). Payment does not happen through Passitpal in this version. We will add in the upcoming version</p>
            </div>
        </div>
    </div>

    {/* For Buyers */}
    <div className="mt-8">
        <h3 className="text-2xl font-semibold mb-4">For Buyers</h3>
        <div className="space-y-4">
            <div>
                <h4 className="font-semibold">How do I buy an item?</h4>
                <p>Use the "Contact Seller" button on a listing to start a conversation. You can ask questions and agree on a price. The final transaction and transfer are handled directly with the seller.</p>
            </div>
            <div>
                <h4 className="font-semibold">Is it safe to buy on Passitpal?</h4>
                <p>We provide tools like user ratings, reviews, and secure chat to help you make informed decisions. However, you are responsible for verifying the item and arranging payment securely. Please read our Safety Guide above carefully.</p>
            </div>
            <div>
                <h4 className="font-semibold">What if the pass/ticket doesn't work?</h4>
                <p>Because you transact directly with the seller, any disputes must be resolved between you and them. Passitpal does not mediate disputes. This is why it's crucial to verify the item *before* you pay. Always check the seller's reputation and reviews. </p>
            </div>
        </div>
    </div>
</div>
    </>
  )
}
