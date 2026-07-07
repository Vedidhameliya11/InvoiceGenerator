// export default function FileAttachmentCard({ fileName, fileType = "PDF", thumbnail, href = "#" }) {
//   return (
//     <div className="file-attachment-card">
//       <div className="file-attachment-info">
//         <div className="file-attachment-icon">
//           <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
//             <path d="M6 2h8l4 4v16H6V2z" stroke="#d93025" strokeWidth="1.5" fill="#fdecea"/>
//             <path d="M14 2v4h4" stroke="#d93025" strokeWidth="1.5"/>
//             <text x="8" y="16" fontSize="6" fontWeight="700" fill="#d93025">PDF</text>
//           </svg>
//         </div>

//         <div className="file-attachment-text">
//           <a href={href} className="file-attachment-name">{fileName}</a>
//           <span className="file-attachment-type">{fileType}</span>
//         </div>
//       </div>

//       <div className="file-attachment-thumbnail">
//         {thumbnail ? (
//           <img src={thumbnail} alt={fileName} />
//         ) : (
//           <div className="file-attachment-thumbnail-placeholder">
//             <span></span>
//             <span></span>
//             <span></span>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }