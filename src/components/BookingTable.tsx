import type { BookingSubmission } from '../types';
import { CUSTOMER_TYPE_LABEL } from '../data/catalog';
import { StatusBadge } from './StatusBadge';
import { formatDate, orDash } from '../utils/format';
import {
  activationCodes,
  activationNames,
  costOwners,
  deliveryWindow,
  totalQuantity,
} from '../utils/summary';

interface BookingTableProps {
  bookings: BookingSubmission[];
  onOpen: (b: BookingSubmission) => void;
  variant?: 'rep' | 'admin';
}

/** Dense overview table — top + bottom rule only, mono right-aligned figures. */
export function BookingTable({ bookings, onOpen, variant = 'rep' }: BookingTableProps) {
  if (bookings.length === 0) {
    return <div className="sk-empty">No submissions yet. Start one when a partner commits.</div>;
  }

  if (variant === 'admin') {
    return (
      <div className="sk-tablewrap">
        <table className="sk-table">
          <thead>
            <tr>
              <th>Submission ID</th>
              <th>Partner</th>
              <th>Customer no.</th>
              <th>Market</th>
              <th>Country</th>
              <th>Region</th>
              <th>Sales rep</th>
              <th>Customer type</th>
              <th>Activations</th>
              <th className="sk-num">Qty</th>
              <th>Cost owner</th>
              <th>Status</th>
              <th>Delivery</th>
              <th>Submitted</th>
              <th>Updated</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map((b) => (
              <tr key={b.submissionId} onClick={() => onOpen(b)}>
                <td className="sk-id">{b.submissionId}</td>
                <td className="sk-strong">{b.partnerInfo.partnerName}</td>
                <td className="sk-id">{orDash(b.partnerInfo.customerNumber)}</td>
                <td>{b.partnerInfo.market}</td>
                <td>{orDash(b.partnerInfo.country)}</td>
                <td>{orDash(b.partnerInfo.region)}</td>
                <td>{b.partnerInfo.salesRepName}</td>
                <td>{b.customerType ? CUSTOMER_TYPE_LABEL[b.customerType] : '—'}</td>
                <td title={activationNames(b).join(', ')}>
                  <span className="sk-mono" style={{ fontSize: 12 }}>
                    {orDash(activationCodes(b))}
                  </span>
                </td>
                <td className="sk-num">{orDash(totalQuantity(b))}</td>
                <td>{orDash(costOwners(b))}</td>
                <td>
                  <StatusBadge status={b.status} />
                </td>
                <td>{orDash(deliveryWindow(b))}</td>
                <td>{formatDate(b.submittedAt)}</td>
                <td>{formatDate(b.updatedAt)}</td>
                <td
                  style={{
                    maxWidth: 220,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                  title={b.partnerInfo.additionalNotes}
                >
                  {orDash(b.partnerInfo.additionalNotes)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="sk-tablewrap">
      <table className="sk-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Partner</th>
            <th>Market</th>
            <th>Customer type</th>
            <th>Activations</th>
            <th>Updated</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((b) => (
            <tr key={b.submissionId} onClick={() => onOpen(b)}>
              <td className="sk-id">{b.submissionId}</td>
              <td className="sk-strong">{b.partnerInfo.partnerName || 'Untitled partner'}</td>
              <td>{orDash(b.partnerInfo.market)}</td>
              <td>{b.customerType ? CUSTOMER_TYPE_LABEL[b.customerType] : '—'}</td>
              <td className="sk-mono" style={{ fontSize: 12 }}>
                {orDash(activationCodes(b))}
              </td>
              <td className="sk-muted">{formatDate(b.updatedAt)}</td>
              <td>
                <StatusBadge status={b.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
