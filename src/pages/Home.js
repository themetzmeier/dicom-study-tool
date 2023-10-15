import React from "react";
import Banner from "../images/home_banner.png";
import dicomView from "../images/dicom_view.png";
import upload from "../images/upload.png";
import dragDrop from "../images/drag_drop.png";

export default function Home({ isMobile }) {
    return (
        <div className="container" >
            <div className="content" >
                <div style={{ "display": "flex", "alignItems": "center" }}>
                    <img style={{ "width": "50%" }} alt="Providers reading medical imagery" src={Banner} />
                    <div style={{ "marginLeft": "64px" }}>
                        <h1 style={{ "fontSize": "2.5em"}}>Where Studying Medical Imagery Happens</h1>
                        <p style={{ "textAlign": "justify", "fontSize": "1.25em" }}>Whether you are a medical student or provider, if you need to review medical imaging in a fun and meaningful way you've come to the right place.</p>
                    </div>
                </div>
                <h1 style={{ "textAlign": "center", "marginTop": "64px"}}>Prepare Yourself to become a Top Tier Provider</h1>
                <div style={{ "display": "flex", "width": "100%" }}>
                    <div style={{ "width": "33.33%", "padding": "32px" }}>
                        <img style={{ "width": "100%" }} alt="DICOM File View Example" src={dicomView} />
                        <p>Select from dozens of DICOM studies to review, analyze, and build your knowledge.</p>
                    </div>
                    <div style={{ "width": "33.33%", "padding": "32px" }}>
                        <img style={{ "width": "100%" }} alt="Drag and Drop Activity Example" src={dragDrop} />
                        <p>Choose one of our active learning activities to take your learning to the next level.</p>
                    </div>
                    <div style={{ "width": "33.33%", "padding": "32px" }}>
                        <img style={{ "width": "100%" }} alt="Upload your own DICOM File Example" src={upload} />
                        <p>Want to train other providers on a case you have seen? Upload a DICOM file and create an activity others can use to learn!</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
