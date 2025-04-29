import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookForm } from '@/app/(admin)/admin/books/components/book-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

// Mock the next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// Mock the sonner toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock the date-fns format function
jest.mock('date-fns', () => ({
  format: jest.fn(() => '2023-01-01'),
}));

// Mock fetch
global.fetch = jest.fn();

describe('BookForm Component', () => {
  // Setup mock router
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  // Mock data for form tests
  const mockAuthors = [
    { _id: 'a1', name: 'Author 1' },
    { _id: 'a2', name: 'Author 2' },
  ];

  const mockCategories = [
    { _id: 'c1', name: 'Category 1' },
    { _id: 'c2', name: 'Category 2' },
  ];

  const mockBook = {
    _id: 'book1',
    title: 'Test Book',
    authorId: 'a1',
    categoryId: 'c1',
    isbn: '1234567890',
    copiesTotal: 5,
    copiesAvailable: 3,
    publishedDate: '2023-01-01',
    tags: ['fiction', 'test'],
    description: 'A test book description',
    coverImage: 'https://example.com/image.jpg',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock fetch for successful responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/authors')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockAuthors),
        });
      } else if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockCategories),
        });
      } else if (url.includes('/api/books')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ id: 'book1' }),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders add book form correctly', async () => {
    render(<BookForm />);
    
    // Check form title
    expect(screen.getByText('Add New Book')).toBeInTheDocument();
    
    // Check form fields are rendered
    expect(screen.getByLabelText('Book Title')).toBeInTheDocument();
    expect(screen.getByText('Author')).toBeInTheDocument();
    expect(screen.getByText('Category')).toBeInTheDocument();
    expect(screen.getByLabelText('ISBN')).toBeInTheDocument();
    expect(screen.getByLabelText('Total Copies')).toBeInTheDocument();
    expect(screen.getByLabelText('Available Copies')).toBeInTheDocument();
    expect(screen.getByText('Published Date')).toBeInTheDocument();
    expect(screen.getByLabelText('Tags (comma separated)')).toBeInTheDocument();
    expect(screen.getByLabelText('Description')).toBeInTheDocument();
    expect(screen.getByLabelText('Cover Image URL (optional)')).toBeInTheDocument();
    
    // Check buttons
    expect(screen.getByText('Cancel')).toBeInTheDocument();
    expect(screen.getByText('Add Book')).toBeInTheDocument();
    
    // Wait for authors and categories to be fetched
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/authors');
      expect(global.fetch).toHaveBeenCalledWith('/api/categories');
    });
  });

  test('renders edit book form correctly with initial data', async () => {
    render(<BookForm bookId="book1" initialData={mockBook} />);
    
    // Check form title shows "Edit Book"
    expect(screen.getByText('Edit Book')).toBeInTheDocument();
    
    // Check form fields have the initial values
    expect(screen.getByLabelText('Book Title')).toHaveValue('Test Book');
    expect(screen.getByLabelText('ISBN')).toHaveValue('1234567890');
    expect(screen.getByLabelText('Total Copies')).toHaveValue(5);
    expect(screen.getByLabelText('Available Copies')).toHaveValue(3);
    expect(screen.getByLabelText('Tags (comma separated)')).toHaveValue('fiction, test');
    expect(screen.getByLabelText('Description')).toHaveValue('A test book description');
    expect(screen.getByLabelText('Cover Image URL (optional)')).toHaveValue('https://example.com/image.jpg');
    
    // Check update button exists
    expect(screen.getByText('Update Book')).toBeInTheDocument();
  });

  test('handles form submission for adding a new book', async () => {
    render(<BookForm />);
    
    // Wait for form to be fully loaded
    await waitFor(() => {
      expect(screen.getByLabelText('Book Title')).toBeInTheDocument();
    });
    
    // Fill out the form
    fireEvent.change(screen.getByLabelText('Book Title'), { 
      target: { value: 'New Test Book' } 
    });
    
    // Select author and category (need to open the selects first)
    const authorSelect = screen.getByText('Select author');
    fireEvent.click(authorSelect);
    await waitFor(() => {
      expect(screen.getByText('Author 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Author 1'));
    
    const categorySelect = screen.getByText('Select category');
    fireEvent.click(categorySelect);
    await waitFor(() => {
      expect(screen.getByText('Category 1')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('Category 1'));
    
    // Fill remaining required fields
    fireEvent.change(screen.getByLabelText('ISBN'), { 
      target: { value: '9876543210' } 
    });
    
    fireEvent.change(screen.getByLabelText('Total Copies'), { 
      target: { value: '3' } 
    });
    
    fireEvent.change(screen.getByLabelText('Available Copies'), { 
      target: { value: '3' } 
    });
    
    // Select published date using the calendar
    const dateButton = screen.getByText('Pick a date').closest('button');
    if (dateButton) fireEvent.click(dateButton);
    
    // Wait for calendar to appear and select a date
    // Note: This is a simplified test for the date picker
    await waitFor(() => {
      const today = screen.getByRole('button', { name: '2023-01-01' });
      if (today) fireEvent.click(today);
    });
    
    // Submit the form
    const submitButton = screen.getByText('Add Book');
    fireEvent.click(submitButton);
    
    // Check that the API was called with the right data
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/books', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: expect.any(String),
      });
      expect(toast.success).toHaveBeenCalledWith('Book added successfully');
      expect(mockRouter.push).toHaveBeenCalledWith('/admin/books');
    });
  });

  test('handles validation errors', async () => {
    render(<BookForm />);
    
    // Submit the form without filling required fields
    const submitButton = screen.getByText('Add Book');
    fireEvent.click(submitButton);
    
    // Check that validation errors are displayed
    await waitFor(() => {
      expect(screen.getByText('Title is required')).toBeInTheDocument();
      expect(screen.getByText('Author is required')).toBeInTheDocument();
      expect(screen.getByText('Category is required')).toBeInTheDocument();
      expect(screen.getByText('ISBN is required')).toBeInTheDocument();
      expect(screen.getByText('Total copies must be at least 1')).toBeInTheDocument();
    });
  });

  test('handles API errors during form submission', async () => {
    // Mock an error response
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Invalid book data' }),
      })
    );
    
    render(<BookForm bookId="book1" initialData={mockBook} />);
    
    // Wait for form to be fully loaded
    await waitFor(() => {
      expect(screen.getByLabelText('Book Title')).toBeInTheDocument();
    });
    
    // Submit the form
    const submitButton = screen.getByText('Update Book');
    fireEvent.click(submitButton);
    
    // Check that error toast is displayed
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Invalid book data');
    });
  });

  test('navigates back to books list when cancel is clicked', async () => {
    render(<BookForm />);
    
    // Click the cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    // Check that router navigation was called
    expect(mockRouter.push).toHaveBeenCalledWith('/admin/books');
  });
});