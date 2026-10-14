# Limitations

This is a nonclinical bench prototype. It does not detect an infection, measure blood glucose, establish safe treatment, prescribe doses or control wound therapy. Ultrasound/violet-light output exists only as an inert software rehearsal. The hardware design omits therapeutic emitters, drivers and command connectors.

Synthetic signal-family labels describe the simulator, not physiology. A high held-out simulator score cannot establish real-world clinical performance. Adaption fine-tuning is adaptation of an existing language model, not training a new foundation model from scratch. The small local classifier can be trained from scratch, and its evidence stays labelled synthetic.

Electrical inputs require compatible buffered/conditioned sensor modules. A raw pH or glucose electrode is not an ADC-ready calibrated reading. Glucose uses arbitrary units unless a separately reviewed bench calibration exists, and wound-fluid measurements cannot be reported as blood glycemia.

No purchased hardware, patient recordings, physical calibration, assembled PCB test or clinical outcome evidence exists. Board files require electrical/manufacturing review before fabrication. USB-powered electronics are for a dry bench, not connection to a person or wound.
