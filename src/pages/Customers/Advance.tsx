// import  { useCustomerLeads } from '../../context/CustomerTypeContext';
// import { format } from 'date-fns';
// import { Phone, Calendar, User } from 'lucide-react';
// import { FaWhatsapp } from 'react-icons/fa';

// const Advance = () => {
//   const { customerTypeLeads } = useCustomerLeads();
//   const advanceLeads = customerTypeLeads.Advance;

//   return (
//     <div className="container mx-auto px-4 py-8">
//       <h1 className="text-2xl font-bold mb-6">Advance Customers</h1>
      
//       {advanceLeads.length === 0 ? (
//         <div className="text-center py-12">
//           <div className="bg-muted border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
//             <User className="h-8 w-8 text-muted-foreground" />
//           </div>
//           <h3 className="mt-4 text-lg font-medium text-foreground">
//             No Advance Customers yet
//           </h3>
//           <p className="mt-1 text-sm text-muted-foreground">
//             Mark leads as Advance in the Leads table to see them here.
//           </p>
//         </div>
//       ) : (
//         <div className="bg-card rounded-lg shadow overflow-hidden">
//           <table className="min-w-full divide-y divide-border">
//             <thead className="bg-muted">
//               <tr>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                   Name
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                   Contact
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                   Added Date
//                 </th>
//                 <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
//                   Actions
//                 </th>
//               </tr>
//             </thead>
//             <tbody className="bg-card divide-y divide-border">
//               {advanceLeads.map((lead) => (
//                 <tr key={lead.id} className="hover:bg-muted/50">
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <div className="flex-shrink-0 h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mr-3">
//                         <span className="text-primary font-medium">
//                           {lead.name?.charAt(0).toUpperCase() || '?'}
//                         </span>
//                       </div>
//                       <div className="text-sm font-medium text-foreground">
//                         {lead.name || 'Unnamed Lead'}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <Phone className="h-4 w-4 text-muted-foreground mr-2" />
//                       <div className="text-sm text-muted-foreground">
//                         {lead.whatsapp_number_ || 'N/A'}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap">
//                     <div className="flex items-center">
//                       <Calendar className="h-4 w-4 text-muted-foreground mr-2" />
//                       <div className="text-sm text-muted-foreground">
//                         {lead.created_time ? format(new Date(lead.created_time), 'MMM dd, yyyy') : 'N/A'}
//                       </div>
//                     </div>
//                   </td>
//                   <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
//                     <a
//                       href={`https://wa.me/${lead.whatsapp_number_}`}
//                       target="_blank"
//                       rel="noopener noreferrer"
//                       className="text-success hover:text-success/80"
//                     >
//                       <FaWhatsapp className="text-xl" />
//                     </a>
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       )}
//     </div>
//   );
// };

// export default Advance;