import EnquiryList from '../../../components/admin/EnquiryList';

const CareerEnquiry = () => (
    <EnquiryList
        type="career"
        breadcrumb="Admin / Dynamic / Career Enquiry"
        title="Career Enquiries"
        description="Applications submitted by candidates through the career enquiry form on your public site."
        extraFields={[
            { key: 'position', label: 'Position Applied For' },
            { key: 'resumeUrl', label: 'Resume', isLink: true },
        ]}
    />
);

export default CareerEnquiry;
