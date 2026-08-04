import EnquiryList from '../../../components/admin/EnquiryList';

const AdmissionEnquiry = () => (
    <EnquiryList
        type="admission"
        breadcrumb="Admin / Dynamic / Admission Enquiry"
        title="Admission Enquiries"
        description="Enquiries submitted by parents through the admission enquiry form on your public site."
        extraFields={[
            { key: 'studentName', label: 'Student Name' },
            { key: 'classApplying', label: 'Class Applying For' },
            { key: 'gender', label: 'Gender' },
            { key: 'address', label: 'Address', detailOnly: true },
        ]}
    />
);

export default AdmissionEnquiry;
