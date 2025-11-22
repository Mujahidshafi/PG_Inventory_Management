import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Layout from '../components/layout';
import { useSession, useSupabaseClient } from '@supabase/auth-helpers-react';

const mockPush = jest.fn();
const mockBack = jest.fn();

jest.mock('next/router', () => ({
  useRouter: () => ({
    push: mockPush,
    back: mockBack,
  }),
}));

jest.mock('@supabase/auth-helpers-react', () => ({
  useSupabaseClient: jest.fn(),
  useSession: jest.fn(),
}));

describe('Layout Component', () => {
  const mockSupabase = {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          single: jest.fn().mockResolvedValue({ data: { role: 'admin' }, error: null }),
        })),
      })),
    })),
    auth: {
      signOut: jest.fn().mockResolvedValue({ error: null }),
    },
  };

  const mockSession = {
    user: { id: '123', email: 'admin@test.com' },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockPush.mockClear();
    mockBack.mockClear();
    useSupabaseClient.mockReturnValue(mockSupabase);
    useSession.mockReturnValue(mockSession);
  });

  it('renders title and logo', () => {
    render(<Layout title="Dashboard">Content</Layout>);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByAltText('Logo')).toHaveAttribute('src', '/Logo.png');
  });

  it('fetches and displays user role', async () => {
  render(<Layout title="Test" />);
  
  fireEvent.click(screen.getByAltText('Settings'));

  // This matches even when split across elements
  await waitFor(() => {
    expect(screen.getByText('admin')).toBeInTheDocument();
    expect(screen.getByText((content, element) => {
      return element.textContent === 'Role: admin';
    })).toBeInTheDocument();
  });
});

it('shows email in settings dropdown', () => {
  render(<Layout title="Test" />);
  fireEvent.click(screen.getByAltText('Settings'));

  // THIS IS BULLETPROOF — NO MORE MULTIPLE ELEMENTS ERROR
  expect(screen.getByText('admin@test.com')).toBeInTheDocument();
  expect(screen.getByText('Account:')).toBeInTheDocument();
});

  it('calls custom onLogout when provided', () => {
    const mockOnLogout = jest.fn();
    render(<Layout title="Test" onLogout={mockOnLogout} />);
    fireEvent.click(screen.getByAltText('Settings'));
    fireEvent.click(screen.getByText(/Log Out/i));
    expect(mockOnLogout).toHaveBeenCalled();
    expect(mockSupabase.auth.signOut).not.toHaveBeenCalled();
  });

  it('falls back to internal logout and redirects to /login', async () => {
    render(<Layout title="Test" />);
    fireEvent.click(screen.getByAltText('Settings'));
    fireEvent.click(screen.getByText(/Log Out/i));
    await waitFor(() => expect(mockSupabase.auth.signOut).toHaveBeenCalled());
    await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/login'));
  });

  it('shows back button and navigates when clicked', () => {
    render(<Layout title="Test" showBack={true} />);
    fireEvent.click(screen.getByText('Back'));
    expect(mockBack).toHaveBeenCalled();
  });

  it('uses custom backRoute when provided', () => {
    render(<Layout title="Test" showBack={true} backRoute="/custom" />);
    fireEvent.click(screen.getByText('Back'));
    expect(mockPush).toHaveBeenCalledWith('/custom');
  });

  it('toggles settings dropdown', () => {
    render(<Layout title="Test" />);
    const settingsBtn = screen.getByAltText('Settings');
    expect(screen.queryByText(/Account:/)).not.toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(screen.getByText(/Account:/)).toBeInTheDocument();
    fireEvent.click(settingsBtn);
    expect(screen.queryByText(/Account:/)).not.toBeInTheDocument();
  });

  it('renders children content', () => {
    render(
      <Layout title="Test">
        <div data-testid="child">Child</div>
      </Layout>
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });
});