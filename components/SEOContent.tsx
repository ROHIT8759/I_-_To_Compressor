import React from 'react';

export default function SEOContent() {
    return (
        <section className="py-16 px-4 md:px-6 lg:px-8 max-w-5xl mx-auto space-y-16 text-slate-300">
            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-8 text-center">
                <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-100">Blazing Fast</h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                        Our optimized algorithms compress your files in seconds, running directly in your browser or on our high-speed edge servers.
                    </p>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-100">Bank-Grade Security</h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                        All transfers are encrypted with 256-bit SSL. Your files are automatically and permanently deleted from our servers after 24 hours.
                    </p>
                </div>
                <div className="space-y-3">
                    <h3 className="text-xl font-semibold text-slate-100">No Quality Loss</h3>
                    <p className="text-sm leading-relaxed text-slate-400">
                        Smart compression technology reduces file size significantly while maintaining the visual quality you need for professional use.
                    </p>
                </div>
            </div>

            {/* How it Works */}
            <article className="space-y-6">
                <h2 className="text-2xl font-bold text-slate-100 text-center">How to Compress Files Online</h2>
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                        <span className="text-indigo-400 font-bold text-lg block mb-2">Step 1</span>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Upload Your File</h3>
                        <p className="text-sm text-slate-400">
                            Drag and drop your document, image, or video into the box above. We support PDF, JPG, PNG, MP4, and more.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                        <span className="text-indigo-400 font-bold text-lg block mb-2">Step 2</span>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Choose Compression Level</h3>
                        <p className="text-sm text-slate-400">
                            Select your desired balance between file size and quality. Our default setting creates the perfect mix for most users.
                        </p>
                    </div>
                    <div className="bg-slate-900/50 p-6 rounded-lg border border-slate-800">
                        <span className="text-indigo-400 font-bold text-lg block mb-2">Step 3</span>
                        <h3 className="text-lg font-medium text-slate-200 mb-2">Download Instantly</h3>
                        <p className="text-sm text-slate-400">
                            Your compressed file is ready in moments. Download it to your device immediately. No email required.
                        </p>
                    </div>
                </div>
            </article>

            {/* FAQ Section */}
            <article className="space-y-8 max-w-3xl mx-auto">
                <h2 className="text-2xl font-bold text-slate-100 text-center mb-8">Frequently Asked Questions</h2>

                <div className="space-y-4">
                    <div className="border-b border-slate-800 pb-4">
                        <h3 className="font-medium text-slate-200 mb-2">Is it safe to compress sensitive documents?</h3>
                        <p className="text-slate-400 text-sm">
                            Yes. We use industry-standard HTTPS encryption for all data transfer. Your files are stored in a secure, private environment and are automatically deleted after 24 hours. We do not look at, copy, or share your files.
                        </p>
                    </div>

                    <div className="border-b border-slate-800 pb-4">
                        <h3 className="font-medium text-slate-200 mb-2">What file formats do you support?</h3>
                        <p className="text-slate-400 text-sm">
                            We currently support popular formats including PDF documents, JPG and PNG images, MP4 and MOV videos, and various other common file types.
                        </p>
                    </div>

                    <div className="border-b border-slate-800 pb-4">
                        <h3 className="font-medium text-slate-200 mb-2">Is there a file size limit?</h3>
                        <p className="text-slate-400 text-sm">
                            Yes, for our free tier we support files up to 100MB to ensure fast processing for everyone.
                        </p>
                    </div>

                    <div className="border-b border-slate-800 pb-4">
                        <h3 className="font-medium text-slate-200 mb-2">Does compression affect quality?</h3>
                        <p className="text-slate-400 text-sm">
                            Our "Smart Compression" (default) is designed to reduce file size by removing redundant data without noticeable quality loss. You can also adjust the compression level manually if you need smaller files or higher quality.
                        </p>
                    </div>
                </div>
            </article>
        </section>
    );
}
