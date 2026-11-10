import { useState } from "react";
import { CheckCircle2, Gift, Eye, EyeOff, Save } from "lucide-react";
import { Link } from "react-router-dom";
import AppLayout from "../../components/layout/AppLayout";
import { getOffer, saveOffer } from "../../utils/storage";

export default function Offers() {
  const [offer,setOffer] = useState(getOffer());
  const [message,setMessage] = useState("");
  function update(key,value){ setOffer(o=>({...o,[key]:value})); }
  function submit(e){ e.preventDefault(); saveOffer(offer); setMessage("Offer updated successfully."); }
  return <AppLayout title="Offers" subtitle="Create and manage offers displayed on the tuition landing page.">
    <div className="offer-management-page">
      <div className="page-actions"><div><h2 className="page-title">Landing Page Offer</h2><p className="page-subtitle">This offer is connected to the Active Landing Page Offer card on the dashboard.</p></div><Link className="secondary-button" to="/">Preview Website</Link></div>
      <div className="offer-management-grid">
        <section className="panel">
          <div className="panel-head"><div><h2><Gift size={18}/> Create / Edit Offer</h2><p>Save the current offer for dashboard use.</p></div></div>
          <form className="offer-form" onSubmit={submit}>
            <label>Discount<input value={offer.discount} onChange={e=>update("discount",e.target.value)} placeholder="20% OFF"/></label>
            <label>Offer Title<input value={offer.title} onChange={e=>update("title",e.target.value)} placeholder="New Admission Offer"/></label>
            <label>Description<textarea rows="4" value={offer.description} onChange={e=>update("description",e.target.value)} /></label>
            <label>Expiry Text<input value={offer.expiry} onChange={e=>update("expiry",e.target.value)} placeholder="Ends in 5 Days"/></label>
            <label className="offer-live-toggle"><input type="checkbox" checked={!!offer.live} onChange={e=>update("live",e.target.checked)}/> Publish offer as LIVE</label>
            {message && <div className="admin-form-message"><CheckCircle2 size={15}/>{message}</div>}
            <button className="primary-button" type="submit"><Save size={15}/> Save Offer</button>
          </form>
        </section>
        <section className="panel">
          <div className="panel-head"><div><h2>{offer.live ? <Eye size={18}/> : <EyeOff size={18}/>} Live Preview</h2><p>Same content shown on the dashboard offer card.</p></div></div>
          <div className="offer-card offer-preview-large">
            <div><span className="offer-fire">🔥 {offer.discount}</span><h3>{offer.title}</h3><p>{offer.description}</p><span className="offer-expiry">{offer.expiry}</span></div>
            <div className="offer-gift">🎁</div>
            {offer.live && <span className="offer-live">LIVE</span>}
          </div>
        </section>
      </div>
    </div>
  </AppLayout>;
}
