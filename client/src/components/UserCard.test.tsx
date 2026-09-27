import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';
import type { User } from '../api/types';

const base: User = {
  id: 1,
  avatar: 'https://x/a.svg',
  first_name: 'Alice',
  last_name: 'Smith',
  age: 30,
  nationality: 'French',
  hobbies: [],
};

describe('UserCard', () => {
  it('renders name, nationality, and age', () => {
    render(<UserCard user={base} />);
    expect(screen.getByText('Alice Smith')).toBeInTheDocument();
    expect(screen.getByText('French')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('shows at most 2 hobbies and a +n chip for the rest', () => {
    render(<UserCard user={{ ...base, hobbies: ['Chess', 'Reading', 'Hiking', 'Yoga'] }} />);
    expect(screen.getByText('Chess')).toBeInTheDocument();
    expect(screen.getByText('Reading')).toBeInTheDocument();
    expect(screen.queryByText('Hiking')).not.toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument();
  });

  it('shows no chips and no +n for zero hobbies', () => {
    render(<UserCard user={base} />);
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('shows no +n when exactly 2 hobbies', () => {
    render(<UserCard user={{ ...base, hobbies: ['Chess', 'Reading'] }} />);
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });

  it('reveals hidden hobbies in a popover when +n is clicked', () => {
    render(<UserCard user={{ ...base, hobbies: ['Chess', 'Reading', 'Hiking', 'Yoga'] }} />);
    fireEvent.click(screen.getByText('+2'));
    expect(screen.getByRole('dialog', { name: 'More hobbies' })).toBeInTheDocument();
    expect(screen.getByText('Hiking')).toBeInTheDocument();
    expect(screen.getByText('Yoga')).toBeInTheDocument();
  });

  it('closes the +n popover on Escape', () => {
    render(<UserCard user={{ ...base, hobbies: ['Chess', 'Reading', 'Hiking', 'Yoga'] }} />);
    fireEvent.click(screen.getByText('+2'));
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByText('Hiking')).not.toBeInTheDocument();
  });
});
