// frontend/src/pages/AboutPage.tsx
const AboutPage = () => (
  <div className="container mx-auto py-16 px-4 max-w-4xl">
  <h1 className="text-4xl font-bold mb-4 text-center">Value Should Never Be Wasted.</h1>
  <p className="text-lg text-muted-foreground mb-12 text-center">
    Our mission is to create India's most trusted and secure community marketplace where unused opportunities find new life.
  </p>

  <div className="grid md:grid-cols-2 gap-8 items-center">
    <div>
      <h2 className="text-3xl font-bold mb-4">Our Story</h2>
      <p className="mb-4">
        Passitpal was born from a simple, common frustration: a 10-month subscription plan was going to waste because life got in the way. Trying to sell the remaining months to friends or on social media was chaotic and met with distrust. It became clear there was no dedicated, secure platform in India for this exact problem.
      </p>
      <p>
        We realized we weren't alone. Millions of rupees in value are lost every year from unused gym memberships, event tickets, and coupons simply because there's no easy or safe way to pass them on. We decided to build the solution.
      </p>
    </div>
    <img src="/herobg.png" alt="Community gathering" className="rounded-lg shadow-lg" />
  </div>

  <div className="mt-16">
    <h2 className="text-3xl font-bold mb-6 text-center">Why Choose Passitpal?</h2>
    <div className="grid md:grid-cols-3 gap-8 text-center">
      <div>
        <h3 className="text-xl font-semibold mb-2">Community First</h3>
        <p>We're more than a platform; we're a community of savvy individuals who believe in smart savings and sustainability. Every deal done here is a win-win.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Focus on Safety</h3>
        <p>With user reviews, secure chat, and clear safety guidelines, we empower you to transact with confidence. Your peace of mind is our top priority.</p>
      </div>
      <div>
        <h3 className="text-xl font-semibold mb-2">Simplicity by Design</h3>
        <p>Inspired by the best platforms, we've made listing an item or finding a deal incredibly simple. List in minutes, find in seconds.</p>
      </div>

      <div>....</div>

     <p>We believe that a change of plans shouldn't mean a loss of money. Our platform empowers you to pass on your pass and get something back, while helping someone else discover a new experience at a fair price.</p>
    </div>
  </div>
</div>
      

);
export default AboutPage;