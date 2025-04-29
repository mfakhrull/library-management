import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BookList } from '@/app/(admin)/admin/books/components/book-list';
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

// Mock fetch
global.fetch = jest.fn();

describe('BookList Component', () => {
  // Setup mock router
  const mockRouter = {
    push: jest.fn(),
    refresh: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock fetch for successful responses
    (global.fetch as jest.Mock).mockImplementation((url) => {
      if (url.includes('/api/books')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            books: [
              {
                _id: '1',
                title: 'Test Book',
                authorId: { _id: 'a1', name: 'Test Author' },
                categoryId: { _id: 'c1', name: 'Test Category' },
                isbn: '1234567890',
                copiesTotal: 10,
                copiesAvailable: 5,
                publishedDate: '2023-01-01',
                tags: ['fiction', 'test'],
              },
            ],
            pagination: {
              total: 1,
              pages: 1,
            },
          }),
        });
      } else if (url.includes('/api/categories')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([
            { _id: 'c1', name: 'Test Category' },
            { _id: 'c2', name: 'Another Category' },
          ]),
        });
      }
      return Promise.reject(new Error('Not found'));
    });
  });

  test('renders book list component with books', async () => {
    render(<BookList />);
    
    // Check initial loading states
    expect(screen.getByText(/Library Books/i)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    // Check book details are displayed
    expect(screen.getByText('Test Author')).toBeInTheDocument();
    expect(screen.getByText('Test Category')).toBeInTheDocument();
    expect(screen.getByText('1234567890')).toBeInTheDocument();
    expect(screen.getByText('2023-01-01')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
  });

  test('handles search functionality', async () => {
    render(<BookList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    // Get search input and button
    const searchInput = screen.getByPlaceholderText('Search by title or tags...');
    const searchButton = screen.getByText('Search').closest('button');
    
    // Type in search and submit
    fireEvent.change(searchInput, { target: { value: 'fiction' } });
    if (searchButton) fireEvent.click(searchButton);
    
    // Verify fetch was called with search query
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('query=fiction'));
    });
  });

  test('handles category filtering', async () => {
    render(<BookList />);
    
    // Wait for categories to load
    await waitFor(() => {
      expect(screen.getByText('All Categories')).toBeInTheDocument();
    });
    
    // Open the select dropdown
    const selectTrigger = screen.getByText('All Categories');
    fireEvent.click(selectTrigger);
    
    // Wait for select items to appear
    await waitFor(() => {
      expect(screen.getByText('Test Category')).toBeInTheDocument();
    });
    
    // Select a category
    fireEvent.click(screen.getByText('Test Category'));
    
    // Verify fetch was called with category filter
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(expect.stringContaining('category=c1'));
    });
  });

  test('navigates to add book page when Add New Book button is clicked', async () => {
    render(<BookList />);
    
    // Find and click Add New Book button
    const addButton = screen.getByText('Add New Book');
    fireEvent.click(addButton);
    
    // Verify router.push was called with the correct path
    expect(mockRouter.push).toHaveBeenCalledWith('/admin/add-book');
  });

  test('handles book deletion', async () => {
    render(<BookList />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('Test Book')).toBeInTheDocument();
    });
    
    // Mock successful delete request
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      })
    );
    
    // Find and click the delete button (which opens the dialog)
    const deleteButton = screen.getAllByTitle('Delete Book')[0];
    fireEvent.click(deleteButton);
    
    // Wait for dialog to appear and click Delete
    await waitFor(() => {
      expect(screen.getByText('Delete Book: Test Book')).toBeInTheDocument();
    });
    
    // Click the Delete confirmation button
    const confirmDeleteButton = screen.getByText('Delete', { selector: 'button' });
    fireEvent.click(confirmDeleteButton);
    
    // Verify fetch was called with DELETE method
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/books/1', {
        method: 'DELETE',
      });
      expect(toast.success).toHaveBeenCalledWith('Book deleted successfully');
    });
  });

  test('displays error message when fetch fails', async () => {
    // Mock fetch to fail
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: 'Failed to fetch books' }),
      })
    );
    
    render(<BookList />);
    
    // Verify error toast is shown
    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Failed to load books');
    });
  });

  test('displays no books found message when books array is empty', async () => {
    // Mock empty books array
    (global.fetch as jest.Mock).mockImplementationOnce(() => 
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          books: [],
          pagination: { total: 0, pages: 0 },
        }),
      })
    );
    
    render(<BookList />);
    
    // Verify no books message is shown
    await waitFor(() => {
      expect(screen.getByText('No books found')).toBeInTheDocument();
    });
  });
});