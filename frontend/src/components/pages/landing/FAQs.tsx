import React from "react";
import { Collapse } from "antd";
const { Panel } = Collapse;

const FAQ = () => {
  return (
    <div className="bg-white dark:bg-neutral-900 py-16 md:py-24 pagePadding">
      <h2 className="text-3xl md:text-4xl font-bold text-center mb-8">
        Frequently Asked Questions
      </h2>

      <div className="max-w-3xl mx-auto space-y-8">
        {/* Sellers Section */}
        <div>
          <h3 className="text-2xl font-semibold mb-4">For Sellers</h3>
          <Collapse
            accordion
            bordered={false}
            className="bg-transparent"
            expandIconPosition="end"
          >
            <Panel header="How do I list my item?" key="1">
              <p className="content-secondary">
                Once your account is set to <b>"Seller"</b> mode, click on{" "}
                <b>"List a Pass"</b> in the navigation bar and fill out the
                simple form with details about your item.
              </p>
            </Panel>
            <Panel header="How do I get paid?" key="2">
              <p className="content-secondary">
                Payment is arranged directly between you and the buyer. Once you
                both agree on the terms in the chat, you can decide on a mutual
                payment method (e.g., UPI, bank transfer). Payment does not
                happen through Passitpal.
              </p>
            </Panel>
          </Collapse>
        </div>

        {/* Buyers Section */}
        <div>
          <h3 className="text-2xl font-semibold mb-4">For Buyers</h3>
          <Collapse
            accordion
            bordered={false}
            className="bg-transparent"
            expandIconPosition="end"
          >
            <Panel header="How do I buy an item?" key="3">
              <p className="content-secondary">
                Use the <b>"Contact Seller"</b> button on a listing to start a
                conversation. You can ask questions and agree on a price. The
                final transaction and transfer are handled directly with the
                seller.
              </p>
            </Panel>
            <Panel header="Is it safe to buy on Passitpal?" key="4">
              <p className="content-secondary">
                We provide tools like user ratings, reviews, and secure chat to
                help you make informed decisions. However, you are responsible
                for verifying the item and arranging payment securely. Please
                read our Safety Guide above carefully.
              </p>
            </Panel>
            <Panel header="What if the pass/ticket doesn't work?" key="5">
              <p className="content-secondary">
                Because you transact directly with the seller, any disputes must
                be resolved between you and them. Passitpal does not mediate
                disputes. This is why it's crucial to verify the item{" "}
                <b>before</b> you pay. Always check the seller's reputation and
                reviews.
              </p>
            </Panel>
          </Collapse>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
