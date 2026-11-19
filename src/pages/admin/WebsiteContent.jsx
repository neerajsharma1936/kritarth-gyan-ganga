import { useEffect, useState } from "react";
import AppLayout from "../../components/layout/AppLayout";
import { getWebsiteContent } from "../../utils/storage";
import { fetchPublishedWebsiteContent, publishWebsiteContent, uploadWebsiteImage } from "../../lib/websiteContent";

export default function WebsiteContent() {
  const [content, setContent] = useState(() => getWebsiteContent());
  useEffect(() => { let active = true; fetchPublishedWebsiteContent().then(value => { if (active) setContent(value); }).catch(error => { if (active) setSaveError(error?.message || "Could not load published website content."); }); return () => { active = false; }; }, []);
  const [saved, setSaved] = useState(false);
  const update = (key, value) => setContent(c => ({ ...c, [key]: value }));
  const [saveError, setSaveError] = useState("");
  const save = async (e) => { e.preventDefault(); setSaved(false); setSaveError(""); try { const published = await publishWebsiteContent(content); setContent(published); setSaved(true); setTimeout(() => setSaved(false), 2500); } catch (error) { setSaveError(error?.message || "Could not publish website content. Check your administrator access and Supabase Storage policies."); } };
  async function uploadImage(key, file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { setSaveError("Please choose an image file."); return; }
    if (file.size > 12 * 1024 * 1024) { setSaveError("Choose an image smaller than 12 MB."); return; }
    const objectUrl = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => { image.onload = resolve; image.onerror = reject; image.src = objectUrl; });
      const scale = Math.min(1, 1200 / Math.max(image.naturalWidth, image.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(image.naturalWidth * scale));
      canvas.height = Math.max(1, Math.round(image.naturalHeight * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Image canvas unavailable");
      ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      let quality = 0.78, blob = null;
      for (let i = 0; i < 7; i++) {
        blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
        if (blob && blob.size <= 300 * 1024) break;
        quality = quality > 0.5 ? quality - 0.1 : quality;
      }
      if (!blob || blob.size > 350 * 1024) throw new Error("Image could not be compressed enough");
      const publicUrl = await uploadWebsiteImage(blob, key);
      update(key, publicUrl); setSaveError(""); setSaved(false);
    } catch (error) { setSaveError(error?.message || "Could not upload the photo. Check your administrator access and try again."); }
    finally { URL.revokeObjectURL(objectUrl); }
  }
  const ImageUpload = ({label, field}) => <div className="field full-span"><label>{label}</label><div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>{content[field] && <img src={content[field]} alt={`${label} preview`} style={{width:100,height:80,objectFit:"cover",borderRadius:10,border:"1px solid #dce5eb"}}/>}<input type="file" accept="image/*" onChange={e=>{uploadImage(field,e.target.files?.[0]);e.target.value="";}}/><button type="button" className="secondary-button" onClick={()=>{update(field,"");setSaved(false);}}>Remove photo</button></div><small>Upload JPG, PNG or WebP. Click Save Changes to publish.</small></div>;
  return <AppLayout title="Website Content" subtitle="Manage the public website without changing its design.">
    <form className="panel" style={{padding:24,maxWidth:1100}} onSubmit={save}>
      <div className="panel-head"><div><h2>Website Settings</h2><p>Changes appear on the landing page immediately after saving.</p></div><button className="primary-button">Save Changes</button></div>
      {saved && <div className="success" style={{marginBottom:18}}>Website content saved successfully.</div>}
      {saveError && <div className="error" role="alert" style={{marginBottom:18}}>{saveError}</div>}
      <div className="form-grid">
        <div className="field"><label>Coaching Name</label><input value="Kritarth Gyan Ganga" readOnly /></div>
        <div className="field"><label>Director Name</label><input value={content.directorName||""} onChange={e=>update("directorName",e.target.value)}/></div>
        <div className="field"><label>Mobile Number</label><input value={content.phone} onChange={e=>update("phone",e.target.value)}/></div>
        <div className="field"><label>Email</label><input type="email" value={content.email} onChange={e=>update("email",e.target.value)}/></div>
        <div className="field full-span"><label>Address</label><input value={content.address} onChange={e=>update("address",e.target.value)}/></div>
        <div className="field"><label>LinkedIn URL</label><input type="url" value={content.linkedin||""} onChange={e=>update("linkedin",e.target.value)}/></div>
        <div className="field"><label>Instagram URL</label><input type="url" value={content.instagram||""} onChange={e=>update("instagram",e.target.value)}/></div>
        <div className="field"><label>Facebook URL</label><input type="url" value={content.facebook||""} onChange={e=>update("facebook",e.target.value)}/></div>
        <div className="field"><label>Twitter / X URL</label><input type="url" value={content.twitter||""} onChange={e=>update("twitter",e.target.value)}/></div>
        <div className="field"><label>YouTube URL</label><input type="url" value={content.youtube||""} onChange={e=>update("youtube",e.target.value)}/></div>
        <div className="field"><label>Hero eyebrow</label><input value={content.heroEyebrow} onChange={e=>update("heroEyebrow",e.target.value)}/></div>
        <div className="field"><label>Hero heading</label><input value={content.heroHeading} onChange={e=>update("heroHeading",e.target.value)}/></div>
        <div className="field full-span"><label>Hero description</label><textarea rows="3" value={content.heroDescription} onChange={e=>update("heroDescription",e.target.value)}/></div>
        <ImageUpload label="Hero photo (girl in the main banner)" field="heroImage" />
        <div className="field full-span"><label>Or use a Hero image URL</label><input value={content.heroImage.startsWith("data:") ? "" : content.heroImage} onChange={e=>update("heroImage",e.target.value)} placeholder="https://..."/><small>Entering a URL replaces the uploaded photo.</small></div>
        <ImageUpload label="Our approach photo" field="approachImage" />
        <div className="field full-span"><label>Or use an Our approach image URL</label><input value={(content.approachImage||"").startsWith("data:") ? "" : (content.approachImage||"")} onChange={e=>update("approachImage",e.target.value)} placeholder="https://..."/><small>Entering a URL replaces the uploaded photo.</small></div>
        <div className="field"><label>Next live class</label><input value={content.nextClass} onChange={e=>update("nextClass",e.target.value)}/></div>
        <div className="field full-span"><label>Student stories (one per line: Name | Class | Result | Quote | Photo URL)</label><textarea rows="7" value={content.stories.map(s=>[s.name,s.tag,s.result,s.quote,s.photo||""].join(" | ")).join("\n")} onChange={e=>update("stories",e.target.value.split("\n").filter(Boolean).map((line,i)=>{const [name,tag,result,quote,photo] = line.split("|").map(x=>x.trim()); return {id:`STORY-${i+1}`,name:name||"Student",tag:tag||"",result:result||"",quote:quote||"",photo:photo||""};}))}/></div>
      </div>
    </form>
  </AppLayout>;
}
