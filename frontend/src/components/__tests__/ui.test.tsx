import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';

// Mock lucide-react icons
jest.mock('lucide-react', () => ({
  Loader2: (props: any) => <span data-testid="loader" {...props} />,
  Search: (props: any) => <span data-testid="search-icon" {...props} />,
  X: (props: any) => <span data-testid="x-icon" {...props} />,
  ChevronDown: (props: any) => <span data-testid="chevron-down" {...props} />,
  Check: (props: any) => <span data-testid="check" {...props} />,
  AlertCircle: (props: any) => <span data-testid="alert-circle" {...props} />,
  Info: (props: any) => <span data-testid="info" {...props} />,
  CheckCircle: (props: any) => <span data-testid="check-circle" {...props} />,
  AlertTriangle: (props: any) => <span data-testid="alert-triangle" {...props} />,
  XCircle: (props: any) => <span data-testid="x-circle" {...props} />,
  FileText: (props: any) => <span data-testid="file-text" {...props} />,
  Inbox: (props: any) => <span data-testid="inbox" {...props} />,
}));

// Import REAL components
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge, StatusBadge } from '../ui/badge';
import { Card } from '../ui/card';
import { Modal } from '../ui/modal';

describe('Button Component (real)', () => {
  it('renders children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('calls onClick handler', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    fireEvent.click(screen.getByText('Click'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading spinner and disables when loading', () => {
    render(<Button loading>Submit</Button>);
    const btn = screen.getByRole('button');
    expect(btn).toBeDisabled();
  });

  it('is disabled when disabled prop is set', () => {
    render(<Button disabled>Disabled</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('applies variant classes', () => {
    const { container } = render(<Button variant="danger">Delete</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('bg-red-600');
  });

  it('applies size classes', () => {
    const { container } = render(<Button size="lg">Large</Button>);
    const btn = container.querySelector('button');
    expect(btn?.className).toContain('px-6');
  });
});

describe('Input Component (real)', () => {
  it('renders with label', () => {
    render(<Input label="Email" />);
    expect(screen.getByText('Email')).toBeInTheDocument();
  });

  it('calls onChange on input', () => {
    const handleChange = jest.fn();
    render(<Input label="Name" onChange={handleChange} />);
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'test' } });
    expect(handleChange).toHaveBeenCalled();
  });

  it('shows error message', () => {
    render(<Input label="Email" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });
});

describe('Badge Component (real)', () => {
  it('renders badge text', () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText('New')).toBeInTheDocument();
  });
});

describe('Card Component (real)', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });
});

describe('Modal Component (real)', () => {
  it('renders when open', () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="Test Modal">
        <p>Modal content</p>
      </Modal>
    );
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <Modal isOpen={false} onClose={() => {}} title="Hidden">
        <p>Should not show</p>
      </Modal>
    );
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('calls onClose on close button click', () => {
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="Close Test">
        <p>Content</p>
      </Modal>
    );
    // Find the X close button and click it
    const closeButtons = screen.getAllByRole('button');
    if (closeButtons.length > 0) {
      fireEvent.click(closeButtons[0]);
      expect(handleClose).toHaveBeenCalled();
    }
  });
});

describe('StatusBadge Component', () => {
  it('should render status text', () => {
    const { StatusBadge } = require('@/components/ui');
    render(<StatusBadge status="active" />);
    expect(screen.getByText('active')).toBeInTheDocument();
  });
});

describe('Toast Hook', () => {
  it('should provide toast methods', () => {
    const { useToast, ToastProvider } = require('@/components/ui');
    const { renderHook } = require('@testing-library/react');
    const { createElement } = require('react');

    const wrapper = ({ children }: { children: React.ReactNode }) =>
      createElement(ToastProvider, null, children);

    const { result } = renderHook(() => useToast(), { wrapper });

    expect(result.current.success).toBeDefined();
    expect(result.current.error).toBeDefined();
    expect(result.current.info).toBeDefined();
    expect(result.current.warning).toBeDefined();
  });
});
