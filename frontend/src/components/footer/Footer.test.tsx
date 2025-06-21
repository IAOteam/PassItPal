
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Footer from './Footer';

// Test suite for the Footer component
describe('Footer', () => {
  // Test case
  it('should render the company name and copyright notice', () => {
    // Arrange: Render the Footer component. It needs a BrowserRouter because it contains <Link> components.
    render(
      <BrowserRouter>
        <Footer />
      </BrowserRouter>
    );

    // Act: Find elements on the screen with more specific queries.
    // We now look for a 'link' (an <a> tag) with the name "Passitpal".
    const companyNameElement = screen.getByRole('link', { name: /passitpal/i });
    const copyrightElement = screen.getByText(/All Rights Reserved/i);

    // Assert: Check if the elements were found in the document.
    expect(companyNameElement).toBeInTheDocument();
    expect(copyrightElement).toBeInTheDocument();
  });
});
